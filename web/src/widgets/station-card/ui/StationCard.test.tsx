import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { Coordinates } from '@/entities/station';
import { stationsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { StationCard } from './StationCard';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const STATION_URL = `${STATIONS_URL}/:number`;
const SOL: Coordinates = { lat: 40.41702, lng: -3.70243 };
// Five minutes after the fixtures' `updatedAt`: their data is still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');
const SERVER_ERROR = 500;
const [puertaDelSolA] = stationsFixture.stations;

type AppRouter = Awaited<ReturnType<typeof renderWithRouter>>['router'];

function respondStaleStation() {
  const { updatedAt, source } = stationsFixture;
  server.use(
    http.get(STATION_URL, () =>
      HttpResponse.json({ station: puertaDelSolA, updatedAt, stale: true, source }),
    ),
  );
}

function failEverything() {
  server.use(
    http.get(STATION_URL, () =>
      HttpResponse.json({ status: SERVER_ERROR }, { status: SERVER_ERROR }),
    ),
    http.get(STATIONS_URL, () => HttpResponse.error()),
  );
}

function renderCard(initialEntry = '/?station=1a') {
  return renderWithRouter(<StationCard center={SOL} />, { initialEntries: [initialEntry] });
}

function card(name: string) {
  return screen.findByRole('region', { name });
}

function searchOf(router: AppRouter) {
  return router.state.location.search;
}

describe('StationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it('shows nothing without a selected station', async () => {
    const { container } = await renderWithRouter(<StationCard center={SOL} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows number, distance, name, both availabilities and the favorite button', async () => {
    await renderCard();

    const region = await card('Puerta del Sol A');
    expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent('Puerta del Sol A');
    expect(await within(region).findByText('Estación 1a · 12 m')).toBeInTheDocument();
    expect(region).toHaveTextContent('12 bicis');
    expect(region).toHaveTextContent('bicis disponibles');
    expect(region).toHaveTextContent('12 anclajes libres');
    expect(within(region).getByRole('button', { name: 'Añadir a favoritas' })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('puts «Cerrar» on top and the star beside the name, in that Tab order', async () => {
    await renderCard();
    const region = await card('Puerta del Sol A');
    const close = within(region).getByRole('button', { name: 'Cerrar' });
    const star = within(region).getByRole('button', { name: 'Añadir a favoritas' });

    expect(close).toHaveClass('row-start-1', 'col-start-2');
    expect(star).toHaveClass('row-start-2', 'col-start-2', 'self-center');
    expect(within(region).getByRole('heading', { level: 2 })).toHaveClass(
      'row-start-2',
      'self-center',
    );
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab();
    expect(star).toHaveFocus();
  });

  it('toggles the favorite with an icon button', async () => {
    await renderCard();
    const region = await card('Puerta del Sol A');

    await userEvent.click(within(region).getByRole('button', { name: 'Añadir a favoritas' }));

    expect(within(region).getByRole('button', { name: 'Quitar de favoritas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(region).queryByRole('button', { name: 'Favorita' })).not.toBeInTheDocument();
  });

  it('shows each availability centered in its own box with its caption', async () => {
    await renderCard();
    const region = await card('Puerta del Sol A');

    const captions = ['bicis disponibles', 'anclajes libres'].map((caption) =>
      within(region).getByText(caption, { ignore: '.sr-only' }),
    );
    for (const caption of captions) {
      const box = caption.closest('div');
      expect(box).toHaveClass('rounded-control', 'bg-chip', 'items-center');
      expect(caption).toHaveClass('text-center');
    }
    expect(captions[0]?.closest('div')?.parentElement).toHaveClass('grid', 'grid-cols-2');
  });

  it('shows only the number when the station has no distance', async () => {
    await renderWithRouter(<StationCard center={undefined} />, {
      initialEntries: ['/?station=1a'],
    });

    expect(await within(await card('Puerta del Sol A')).findByText('Estación 1a')).toBeVisible();
  });

  it('keeps both availabilities whatever the mode', async () => {
    await renderCard('/?station=1a&need=docks');

    const region = await card('Puerta del Sol A');
    expect(region).toHaveTextContent('12 bicis');
    expect(region).toHaveTextContent('12 anclajes libres');
  });

  it('greys out both availabilities when the data is not confirmed', async () => {
    respondStaleStation();
    await renderCard();

    const region = await card('Puerta del Sol A');
    expect(await within(region).findAllByText('Sin confirmar')).toHaveLength(2);
  });

  it('closes with «Cerrar»', async () => {
    const { router } = await renderCard();

    await userEvent.click(
      within(await card('Puerta del Sol A')).getByRole('button', { name: 'Cerrar' }),
    );

    expect(searchOf(router).station).toBeUndefined();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('closes with Escape while the focus is inside', async () => {
    const { router } = await renderCard();
    within(await card('Puerta del Sol A'))
      .getByRole('button', { name: 'Añadir a favoritas' })
      .focus();

    await userEvent.keyboard('{Escape}');

    expect(searchOf(router).station).toBeUndefined();
  });

  it('does not take the focus when it opens', async () => {
    await renderCard();
    await card('Puerta del Sol A');

    expect(document.body).toHaveFocus();
  });

  it('says when the station does not exist, and still closes', async () => {
    await renderCard('/?station=999');

    const region = await card('Estación 999');
    expect(await within(region).findByRole('alert')).toHaveTextContent('Estación no encontrada');
    expect(within(region).getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('offers a retry when the station cannot be loaded', async () => {
    failEverything();
    await renderCard();

    const region = await card('Estación 1a');
    expect(await within(region).findByRole('alert')).toHaveTextContent(
      'No se pudo cargar la estación',
    );
    expect(within(region).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it.each([
    { state: 'normal', entry: '/?station=1a', name: 'Puerta del Sol A', stale: false },
    { state: 'unconfirmed', entry: '/?station=1a', name: 'Puerta del Sol A', stale: true },
    { state: 'not found', entry: '/?station=999', name: 'Estación 999', stale: false },
  ])('has no axe violations when $state', async ({ entry, name, stale }) => {
    if (stale) respondStaleStation();
    const { container } = await renderCard(entry);
    await card(name);
    vi.useRealTimers();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
