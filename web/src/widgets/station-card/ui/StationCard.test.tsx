import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import type { Coordinates } from '@/entities/station';
import { internalErrorProblem, stationsFixture } from '@/shared/api/mocks/fixtures';
import { problemResponse } from '@/shared/api/mocks/handlers';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import { formatClock } from '@/shared/lib';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { StationCard } from './StationCard';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const STATION_URL = `${STATIONS_URL}/:number`;
const SOL: Coordinates = { lat: 40.41702, lng: -3.70243 };
// Five minutes after the fixtures' `updatedAt`: their data is still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');
const [puertaDelSolA] = stationsFixture.stations;
const NOT_FOUND_TEXT =
  'No hay ninguna estación de BiciMAD con el número 999. Puede que el enlace sea antiguo o que la estación se haya retirado.';
// Both footers: «Actualizado hace …» and «Último dato: …».
const FOOTER = /^(Actualizado|Último dato)/;

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
    http.get(STATION_URL, () => problemResponse(internalErrorProblem('/v1/bicimad/stations/1a'))),
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
    expect(within(region).getByRole('button', { name: 'Favorita' })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('puts «Cerrar» on top and the star beside the name, in that Tab order', async () => {
    await renderCard();
    const region = await card('Puerta del Sol A');
    const close = within(region).getByRole('button', { name: 'Cerrar' });
    const star = within(region).getByRole('button', { name: 'Favorita' });

    const meta = await within(region).findByText('Estación 1a · 12 m');
    const heading = within(region).getByRole('heading', { level: 2 });

    expect(close.parentElement?.parentElement).toContainElement(meta);
    expect(meta.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(star.parentElement?.parentElement).toBe(heading.parentElement);
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab();
    expect(star).toHaveFocus();
  });

  it('toggles the favorite with an icon button', async () => {
    await renderCard();
    const region = await card('Puerta del Sol A');

    await userEvent.click(within(region).getByRole('button', { name: 'Favorita' }));

    expect(within(region).getByRole('button', { name: 'Favorita' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows each availability centered in its own box with its caption', async () => {
    await renderCard();
    const region = await card('Puerta del Sol A');

    const captions = ['bicis disponibles', 'anclajes libres'].map((caption) =>
      within(region).getByText(caption, { ignore: '.sr-only' }),
    );
    for (const caption of captions) {
      const box = caption.closest('div');
      expect(box).toHaveClass('rounded-control', 'items-center', 'text-center');
      expect(box).toHaveClass('bg-tone-success-soft', 'border-2', 'border-tone-success-line');
    }
    expect(captions[0]?.closest('dl')).toHaveClass('grid', 'grid-cols-2');
  });

  it('tells screen readers each count with its status, under its caption', async () => {
    await renderCard('/?station=1b');
    const region = await card('Puerta del Sol B');

    const terms = within(region).getAllByRole('term');
    expect(terms.map((term) => term.textContent)).toEqual(['bicis disponibles', 'anclajes libres']);
    for (const [index, text] of ['2 bicis, Pocas', '22 anclajes libres, Disponible'].entries()) {
      const spoken = within(region).getByText(text);
      expect(spoken).toHaveClass('sr-only');
      expect(spoken.closest('dd')).toBe(terms[index]?.nextElementSibling);
    }
  });

  it('draws an empty count in a white box with a dashed red border', async () => {
    await renderCard('/?station=3');
    const region = await card('Plaza Conde Suchil');

    const box = within(region).getByText('Sin bicis').closest('div');
    expect(box).toHaveClass('bg-surface', 'border-dashed', 'border-tone-danger-line');
    expect(within(region).getByText('0 bicis, Sin bicis')).toHaveClass('sr-only');
  });

  it('shows a spinner and says what it waits for while the station loads', async () => {
    server.use(
      http.get(STATION_URL, () => delay('infinite')),
      http.get(STATIONS_URL, () => delay('infinite')),
    );
    await renderCard();

    const region = await card('Estación 1a');
    const label = within(region).getByText('Cargando estación…');
    expect(label).toHaveClass('sr-only');
    expect(label.parentElement).toHaveAttribute('aria-busy', 'true');
    expect(label.parentElement?.querySelector('svg')).toHaveClass('animate-spin');
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
    for (const label of within(region).getAllByText('Sin confirmar')) {
      expect(label.closest('div')).toHaveClass('bg-tone-muted', 'border-tone-muted-line');
    }
    expect(within(region).getByText('12 bicis, Sin confirmar')).toHaveClass('sr-only');
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
      .getByRole('button', { name: 'Favorita' })
      .focus();

    await userEvent.keyboard('{Escape}');

    expect(searchOf(router).station).toBeUndefined();
  });

  it('does not take the focus when it opens', async () => {
    await renderCard();
    await card('Puerta del Sol A');

    expect(document.body).toHaveFocus();
  });

  it('says when the station does not exist, and still closes (SC6)', async () => {
    await renderCard('/?station=999');

    const region = await card('Estación no encontrada');
    expect(within(region).getByText('Estación 999')).toBeInTheDocument();
    expect(await within(region).findByRole('alert')).toHaveTextContent(NOT_FOUND_TEXT);
    expect(within(region).getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    expect(within(region).queryByRole('button', { name: 'Favorita' })).not.toBeInTheDocument();
    expect(within(region).queryByText(FOOTER)).not.toBeInTheDocument();
  });

  it('goes back to the list from a missing station, as «Cerrar» does', async () => {
    const { router } = await renderCard('/?station=999');

    await userEvent.click(
      within(await card('Estación no encontrada')).getByRole('button', {
        name: 'Volver a la lista',
      }),
    );

    expect(searchOf(router).station).toBeUndefined();
  });

  it('draws «Volver a la lista» as the library primary button', async () => {
    await renderCard('/?station=999');

    const back = within(await card('Estación no encontrada')).getByRole('button', {
      name: 'Volver a la lista',
    });
    expect(back).toHaveClass('focus-ring', 'h-11', 'bg-primary', 'text-primary-foreground');
  });

  it('says a station out of service cannot be used, instead of its counts (SC6)', async () => {
    await renderCard('/?station=2');

    const region = await card('Miguel Moya');
    const notice = within(region).getByRole('status');
    expect(notice).toHaveTextContent('Fuera de servicio No se pueden sacar ni dejar bicis.');
    expect(within(region).queryByText('bicis disponibles')).not.toBeInTheDocument();
    expect(within(region).getByText(FOOTER)).toHaveTextContent('Actualizado hace 5 minutos');
  });

  it('writes «Fuera de servicio» in the neutral label color', async () => {
    await renderCard('/?station=2');

    const region = await card('Miguel Moya');
    expect(within(region).getByText('Fuera de servicio')).toHaveClass(
      'font-semibold',
      'text-tone-neutral-label',
    );
  });

  it('dates the station at its foot', async () => {
    await renderCard();

    const region = await card('Puerta del Sol A');
    expect(within(region).getByText(FOOTER)).toHaveTextContent('Actualizado hace 5 minutos');
  });

  it('gives the time and age of unconfirmed data at its foot', async () => {
    respondStaleStation();
    await renderCard();

    const region = await card('Puerta del Sol A');
    expect(
      await within(region).findByText(
        `Último dato: ${formatClock(new Date(stationsFixture.updatedAt))} · hace 5 min`,
      ),
    ).toBeInTheDocument();
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
    expect(within(region).getByRole('alert')).toHaveTextContent(
      'El servicio de BiciMAD no está respondiendo. Suele ser temporal.',
    );
    expect(within(region).queryByText(FOOTER)).not.toBeInTheDocument();
  });

  it('keeps «Reintentar» busy while it asks again', async () => {
    failEverything();
    await renderCard();
    const region = await card('Estación 1a');
    await within(region).findByRole('alert');
    server.use(http.get(STATION_URL, () => delay('infinite')));

    const retry = within(region).getByRole('button', { name: 'Reintentar' });
    await userEvent.click(retry);

    expect(retry).toHaveAttribute('aria-busy', 'true');
    expect(retry).toHaveFocus();
  });

  it('frames the load error as a danger notice with its icon and a secondary «Reintentar»', async () => {
    failEverything();
    await renderCard();
    const region = await card('Estación 1a');

    const alert = await within(region).findByRole('alert');
    const notice = alert.parentElement;
    expect(notice).toHaveClass('bg-tone-danger-soft');
    expect(notice?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(within(region).getByRole('button', { name: 'Reintentar' })).toHaveClass(
      'bg-surface',
      'text-primary',
      'border-primary',
    );
  });

  it('has no axe violations when the station cannot be loaded', async () => {
    failEverything();
    const { container } = await renderCard();
    await within(await card('Estación 1a')).findByRole('alert');
    vi.useRealTimers();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it.each([
    { state: 'normal', entry: '/?station=1a', name: 'Puerta del Sol A', stale: false },
    { state: 'unconfirmed', entry: '/?station=1a', name: 'Puerta del Sol A', stale: true },
    { state: 'not found', entry: '/?station=999', name: 'Estación no encontrada', stale: false },
    { state: 'out of service', entry: '/?station=2', name: 'Miguel Moya', stale: false },
  ])('has no axe violations when $state', async ({ entry, name, stale }) => {
    if (stale) respondStaleStation();
    const { container } = await renderCard(entry);
    await card(name);
    vi.useRealTimers();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
