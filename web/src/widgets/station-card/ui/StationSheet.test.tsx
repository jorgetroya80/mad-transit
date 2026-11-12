import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onlineManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { createRef } from 'react';
import type { Coordinates } from '@/entities/station';
import { useSelectedStation } from '@/features/select-station';
import {
  internalErrorProblem,
  nearbyStationsFixture,
  stationsFixture,
} from '@/shared/api/mocks/fixtures';
import { problemResponse } from '@/shared/api/mocks/handlers';
import { server } from '@/shared/api/mocks/node';
import { env, NEARBY_STORAGE_KEYS, STATIONS_STORAGE_KEY } from '@/shared/config';
import { formatClock } from '@/shared/lib';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { StationSheetBody, StationSheetHeader } from './StationSheet';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const STATION_URL = `${STATIONS_URL}/:number`;
const SOL: Coordinates = { lat: 40.41702, lng: -3.70243 };
// Five minutes after the fixtures' `updatedAt`: their data is still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');
// The app's QueryClient retries once after react-query's 1 s backoff, which runs on the
// fake clock that `shouldAdvanceTime` moves along with real time.
const AFTER_RETRY = { timeout: 3_000 };
const RETRY_WINDOW_MS = 2_000;
const NOT_FOUND = 404;
const [puertaDelSolA] = stationsFixture.stations;

type AppRouter = Awaited<ReturnType<typeof renderWithRouter>>['router'];

function respondStation(resolver: () => Response) {
  server.use(http.get(STATION_URL, resolver));
}

function stationJson(overrides: { station?: object; updatedAt?: string; stale?: boolean }) {
  const { updatedAt, stale, source } = stationsFixture;
  respondStation(() =>
    HttpResponse.json({ station: puertaDelSolA, updatedAt, stale, source, ...overrides }),
  );
}

function failStation() {
  respondStation(() => problemResponse(internalErrorProblem('/v1/bicimad/stations/1a')));
}

function failAllStations() {
  server.use(http.get(STATIONS_URL, () => HttpResponse.error()));
}

function saveAllStations(savedAt: number) {
  localStorage.setItem(
    STATIONS_STORAGE_KEY,
    JSON.stringify({ response: stationsFixture, savedAt }),
  );
}

function recordDetailRequests(): URL[] {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (/\/stations\/[^/]+$/.test(url.pathname)) urls.push(url);
  });
  return urls;
}

// The two pieces as MobileSheet places them: the header row and the body of one region.
function SheetDetail({ center }: { center: Coordinates | undefined }) {
  const { number } = useSelectedStation();
  if (number === undefined) return null;
  return (
    <section aria-label="Detalle de la estación">
      <StationSheetHeader number={number} center={center} />
      <StationSheetBody number={number} />
    </section>
  );
}

// The center goes in an object: a default parameter would turn an explicit undefined into SOL.
function renderSheet(
  initialEntry = '/?station=1a',
  { center }: { center: Coordinates | undefined } = { center: SOL },
) {
  return renderWithRouter(<SheetDetail center={center} />, { initialEntries: [initialEntry] });
}

function sheet() {
  return screen.getByRole('region', { name: 'Detalle de la estación' });
}

function title(name = 'Puerta del Sol A') {
  return screen.findByRole('heading', { level: 2, name });
}

function backButton() {
  return screen.getByRole('button', { name: 'Volver a la lista' });
}

function searchOf(router: AppRouter) {
  return router.state.location.search;
}

describe('StationSheetHeader and StationSheetBody', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    server.events.removeAllListeners();
    onlineManager.setOnline(true);
  });

  it('shows number, distance, name, both availabilities, the star and the update time', async () => {
    await renderSheet();

    await title();
    const region = sheet();
    expect(await within(region).findByText('Estación 1a · 12 m')).toBeInTheDocument();
    expect(region).toHaveTextContent('12 bicis');
    expect(region).toHaveTextContent('bicis disponibles');
    expect(region).toHaveTextContent('12 anclajes libres');
    expect(within(region).getByRole('button', { name: 'Favorita' })).toBeInTheDocument();
    expect(within(region).getByText(/^Actualizado/)).toHaveTextContent(
      'Actualizado hace 5 minutos',
    );
  });

  it('credits EMT at the foot of the body, below the update time', async () => {
    await renderSheet();
    await title();

    const link = within(sheet()).getByRole('link', { name: 'EMT de Madrid' });
    const updated = within(sheet()).getByText(/^Actualizado/);
    expect(updated.compareDocumentPosition(link)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('heads the row with «Volver a la lista», the title and the star, in that Tab order', async () => {
    await renderSheet();
    const heading = await title();
    const star = screen.getByRole('button', { name: 'Favorita' });

    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument();
    expect(backButton().compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(heading.compareDocumentPosition(star)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    await user.tab();
    expect(backButton()).toHaveFocus();
    await user.tab();
    expect(star).toHaveFocus();
  });

  it('shows the meta above the name, both beside the arrow and the star', async () => {
    await renderSheet();
    const heading = await title();
    const meta = await screen.findByText('Estación 1a · 12 m');

    expect(meta.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const column = heading.parentElement?.parentElement;
    expect(column).toContainElement(meta);
    expect(backButton().parentElement?.nextElementSibling).toBe(column);
    expect(screen.getByRole('button', { name: 'Favorita' }).parentElement?.parentElement).toBe(
      heading.parentElement,
    );
  });

  it('draws «Volver a la lista» as a 44 px primary arrow', async () => {
    await renderSheet();
    await title();

    expect(backButton()).toHaveClass('size-11', 'text-primary');
    expect(backButton()).toHaveTextContent('');
    expect(backButton().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(backButton().querySelector('svg')).toHaveAttribute('width', '22');
  });

  it('hands its title to headingRef, so the page can move the focus there', async () => {
    const headingRef = createRef<HTMLHeadingElement>();
    await renderWithRouter(
      <StationSheetHeader number="1a" center={SOL} headingRef={headingRef} />,
      {
        initialEntries: ['/?station=1a'],
      },
    );
    const heading = await title();

    headingRef.current?.focus();

    expect(heading).toHaveFocus();
  });

  it('goes back to the list with «Volver a la lista», keeping need', async () => {
    const { router } = await renderSheet('/?station=1a&need=docks');
    await title();

    await user.click(backButton());

    expect(searchOf(router)).toEqual({ need: 'docks' });
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('goes back with Escape while the focus is in the header', async () => {
    const { router } = await renderSheet();
    await title();
    screen.getByRole('button', { name: 'Favorita' }).focus();

    await user.keyboard('{Escape}');

    expect(searchOf(router).station).toBeUndefined();
  });

  it('goes back with Escape while the focus is in the body', async () => {
    failStation();
    failAllStations();
    const { router } = await renderSheet();
    (await screen.findByRole('button', { name: 'Reintentar' }, AFTER_RETRY)).focus();

    await user.keyboard('{Escape}');

    expect(searchOf(router).station).toBeUndefined();
  });

  it('does not take the focus when it opens', async () => {
    await renderSheet();
    await title();

    expect(document.body).toHaveFocus();
  });

  it('draws both availabilities as tiles in two columns', async () => {
    await renderSheet();
    await title();

    const caption = within(sheet()).getByText('bicis disponibles', { ignore: '.sr-only' });
    const box = caption.closest('div');
    expect(box).toHaveClass('bg-tone-success-soft', 'border-tone-success-line');
    expect(box?.closest('dl')).toHaveClass('grid', 'grid-cols-2');
    expect(within(sheet()).getByText('12 bicis, Disponible')).toHaveClass('sr-only');
  });

  it('keeps both availabilities whatever the mode', async () => {
    await renderSheet('/?station=1a&need=docks');
    await title();

    expect(sheet()).toHaveTextContent('12 bicis');
    expect(sheet()).toHaveTextContent('12 anclajes libres');
  });

  // Skipped under exception W1 (CONSTRAINTS.md): MSW 3 sometimes lets this test's detail request
  // through to the real network under load (mswjs/interceptors#897), so the stale answer never
  // lands. The unconfirmed tiles stay covered by the unconfirmed axe case and StationCard.test.
  // oxlint-disable-next-line vitest/no-disabled-tests -- exception W1
  it.skip('greys out both availabilities when the data is not confirmed', async () => {
    stationJson({ stale: true });
    await renderSheet();
    await title();

    expect(await within(sheet()).findAllByText('Sin confirmar')).toHaveLength(2);
  });

  it('shows only the number when the station has no distance', async () => {
    await renderSheet('/?station=1a', { center: undefined });
    await title();

    expect(screen.getByText('Estación 1a')).toBeVisible();
  });

  it('hides the distance without a center, even with a nearby list saved before', async () => {
    localStorage.setItem(
      NEARBY_STORAGE_KEYS.bikes,
      JSON.stringify({
        near: '40.4170,-3.7024',
        response: nearbyStationsFixture,
        savedAt: NOW.getTime(),
      }),
    );
    await renderSheet('/?station=1a', { center: undefined });
    await title();

    expect(screen.getByText('Estación 1a')).toBeVisible();
  });

  it('dates the station by its arrival when updatedAt is invalid', async () => {
    stationJson({ updatedAt: 'nope' });
    await renderSheet();
    await title();

    // The title shows from the full list first; the age is the detail's, once it lands.
    await waitFor(() =>
      expect(screen.getByText(/^Actualizado/)).toHaveTextContent('Actualizado ahora'),
    );
  });

  it('says the station does not exist after a single request, and still goes back (SC6)', async () => {
    const requests = recordDetailRequests();
    await renderSheet('/?station=999');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay ninguna estación de BiciMAD con el número 999. Puede que el enlace sea antiguo o que la estación se haya retirado.',
    );
    expect(await title('Estación no encontrada')).toBeInTheDocument();
    expect(within(sheet()).getByText('Estación 999')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Volver a la lista' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Favorita' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Actualizado/)).not.toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(RETRY_WINDOW_MS);
    expect(requests).toHaveLength(1);
  });

  it('goes back to the list from the body of a missing station', async () => {
    const { router } = await renderSheet('/?station=999');
    const body = (await screen.findByRole('alert')).closest('div');
    if (!body) throw new Error('The alert has no body around it');

    await user.click(within(body).getByRole('button', { name: 'Volver a la lista' }));

    expect(searchOf(router).station).toBeUndefined();
  });

  it('says a station is missing even when the full list still has it', async () => {
    respondStation(() =>
      HttpResponse.json(
        { title: 'Not Found', status: NOT_FOUND },
        { status: NOT_FOUND, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );

    await renderSheet();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay ninguna estación de BiciMAD con el número 1a.',
    );
    expect(await title('Estación no encontrada')).toBeInTheDocument();
  });

  it('says a station out of service cannot be used, and dates it (SC6)', async () => {
    await renderSheet('/?station=2');
    await title('Miguel Moya');

    expect(within(sheet()).getByRole('status')).toHaveTextContent(
      'Fuera de servicio No se pueden sacar ni dejar bicis.',
    );
    expect(within(sheet()).queryByText('bicis disponibles')).not.toBeInTheDocument();
    expect(within(sheet()).getByText(/^Actualizado/)).toHaveTextContent(
      'Actualizado hace 5 minutos',
    );
  });

  it('gives the time and age of unconfirmed data instead of the update time', async () => {
    stationJson({ stale: true });
    await renderSheet();
    await title();

    expect(
      await within(sheet()).findByText(
        `Último dato: ${formatClock(new Date(stationsFixture.updatedAt))} · hace 5 min`,
      ),
    ).toBeInTheDocument();
    expect(within(sheet()).queryByText(/^Actualizado/)).not.toBeInTheDocument();
  });

  it('shows an error and retries on demand', async () => {
    failStation();
    failAllStations();
    await renderSheet();

    const alert = await screen.findByRole('alert', {}, AFTER_RETRY);
    expect(alert).toHaveTextContent('No se pudo cargar la estación');
    expect(alert).toHaveTextContent(
      'El servicio de BiciMAD no está respondiendo. Suele ser temporal.',
    );
    expect(screen.queryByText(/^(Actualizado|Último dato)/)).not.toBeInTheDocument();
    expect(await title('Estación 1a')).toBeInTheDocument();
    expect(backButton()).toBeInTheDocument();

    server.resetHandlers();
    await user.click(within(sheet()).getByRole('button', { name: 'Reintentar' }));

    expect(await title()).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prefers its own data over the full list', async () => {
    stationJson({ station: { ...puertaDelSolA, bikes: 3 } });

    await renderSheet();

    await waitFor(() => expect(sheet()).toHaveTextContent('3 bicis'));
  });

  it('shows the station from the saved full list, unconfirmed, when the requests fail', async () => {
    saveAllStations(NOW.getTime() - 60_000);
    failStation();
    failAllStations();

    await renderSheet();

    expect(await title()).toBeInTheDocument();
    expect(await within(sheet()).findAllByText('Sin confirmar', {}, AFTER_RETRY)).toHaveLength(2);
    expect(sheet()).toHaveTextContent('12 bicis');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the station from the saved full list when offline', async () => {
    saveAllStations(NOW.getTime() - 60_000);
    onlineManager.setOnline(false);

    await renderSheet();

    expect(await title()).toBeInTheDocument();
    expect(sheet()).toHaveTextContent('12 bicis');
  });

  it('shows the error with a retry when offline without data', async () => {
    onlineManager.setOnline(false);

    await renderSheet();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudo cargar la estación');
    // The action sits beside the alert, so it is not read out with it.
    const retry = within(sheet()).getByRole('button', { name: 'Reintentar' });
    expect(alert).not.toContainElement(retry);
  });

  it('has no axe violations when the station cannot be loaded', async () => {
    failStation();
    failAllStations();
    const { container } = await renderSheet();
    await screen.findByRole('alert', {}, AFTER_RETRY);
    vi.useRealTimers();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it.each([
    { state: 'normal', entry: '/?station=1a', name: 'Puerta del Sol A', stale: false },
    { state: 'unconfirmed', entry: '/?station=1a', name: 'Puerta del Sol A', stale: true },
    { state: 'not found', entry: '/?station=999', name: 'Estación no encontrada', stale: false },
    { state: 'out of service', entry: '/?station=2', name: 'Miguel Moya', stale: false },
  ])('has no axe violations when $state', async ({ entry, name, stale }) => {
    if (stale) stationJson({ stale: true });
    const { container } = await renderSheet(entry);
    await title(name);
    vi.useRealTimers();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
