import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import {
  internalErrorProblem,
  nearbyStationsFixture,
  stationsFixture,
} from '@/shared/api/mocks/fixtures';
import { problemResponse } from '@/shared/api/mocks/handlers';
import { server } from '@/shared/api/mocks/node';
import { env, FAVORITES_STORAGE_KEY, MADRID_CENTER } from '@/shared/config';
import type * as SharedUi from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { stubMatchMedia } from '../../../../test/matchMedia';
import { renderWithRouter } from '../../../../test/renderWithRouter';

type LngLat = { lng: number; lat: number };
type CapturedMapProps = {
  selectedId?: string;
  onSelectPoint?: (id: string) => void;
  focus?: LngLat;
  userLocation?: LngLat;
  focusPadding?: { bottom: number; right?: number };
};

const mapRenders = vi.hoisted(() => [] as CapturedMapProps[]);

// jsdom has no WebGL: the map only records the props it receives; the rest of the UI is real.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: (props: CapturedMapProps) => {
    mapRenders.push(props);
    return <div data-testid="base-map" />;
  },
}));

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const USER = { lat: 40.4169, lng: -3.7033 };
// Station 1a in the fixtures.
const PUERTA_DEL_SOL_A = { lat: 40.4170224, lng: -3.7024255 };
// Station 1b in the fixtures.
const PUERTA_DEL_SOL_B = { lat: 40.4171037, lng: -3.7025031 };
const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;

// 'pending' never answers, like a browser still asking for the position.
type GeoAnswer = 'granted' | 'denied' | 'unavailable' | 'pending';

// jsdom has no geolocation: every request is answered at once with the current answer.
function stubGeolocation(initialAnswer: GeoAnswer) {
  let answer = initialAnswer;
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((onSuccess, onError) => {
    if (answer === 'pending') return;
    if (answer === 'granted') {
      onSuccess({ coords: { latitude: USER.lat, longitude: USER.lng } } as GeolocationPosition);
      return;
    }
    const code = answer === 'denied' ? PERMISSION_DENIED : POSITION_UNAVAILABLE;
    onError?.({ code, PERMISSION_DENIED } as GeolocationPositionError);
  });
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
  return {
    getCurrentPosition,
    answerWith(next: GeoAnswer) {
      answer = next;
    },
  };
}

function recordNearbyRequests(): URL[] {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.has('near')) urls.push(url);
  });
  return urls;
}

// Holds the docks answer until `release`, so the test can look at the screen in between.
function holdDocksResponse() {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get(STATIONS_URL, async ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (!params.has('near')) return HttpResponse.json(stationsFixture);
      if (params.get('need') === 'docks') await released;
      return HttpResponse.json(nearbyStationsFixture);
    }),
  );
  return { release };
}

function lastMapProps(): CapturedMapProps {
  const props = mapRenders.at(-1);
  if (!props) throw new Error('BaseMap was not rendered');
  return props;
}

function renderPage(initialEntry = '/') {
  return renderWithRouter(undefined, { initialEntries: [initialEntry] });
}

function panel() {
  return screen.getByRole('region', { name: 'Estaciones' });
}

function sheetHandle() {
  return screen.getByRole('button', { name: 'Ocultar lista' });
}

function detailHandle() {
  return screen.getByRole('button', { name: 'Ocultar detalle' });
}

// At hidden the handle is a strip named by its visible text.
function listStrip() {
  return screen.getByRole('button', { name: /^Mostrar lista · / });
}

function detailStrip() {
  return screen.getByRole('button', { name: /^Mostrar detalle · / });
}

function detailSheet() {
  return screen.getByRole('region', { name: 'Detalle de la estación' });
}

function backButton() {
  return screen.getByRole('button', { name: 'Volver a la lista' });
}

function sheetSubtitle() {
  return screen.getByText(/^Cerca de (ti|la Puerta del Sol)/);
}

function recenterButton() {
  return screen.getByRole('button', { name: 'Centrar en mi posición' });
}

// The slot the page places above the sheet, around the library button.
function recenterSlot() {
  return recenterButton().parentElement;
}

async function rowIn(section: string, number: string) {
  const region = await screen.findByRole('region', { name: section });
  return within(region).findByRole('button', { name: new RegExp(`^Estación ${number},`) });
}

async function detailTitle(name: string) {
  return screen.findByRole('heading', { level: 2, name });
}

function saveFavorites(numbers: string[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(numbers));
}

// Five minutes after the fixtures' `updatedAt`: their data is still confirmed. Only the date is
// fake, so timers and user events run as usual.
const NOW = new Date('2026-10-13T10:20:00Z');

beforeEach(() => {
  mapRenders.length = 0;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, 'geolocation');
  localStorage.clear();
  server.events.removeAllListeners();
});

describe('MapPage', () => {
  describe('landmarks', () => {
    beforeEach(() => stubGeolocation('granted'));

    it('names the page and shows the map', async () => {
      await renderPage();

      expect(screen.getByRole('heading', { level: 1, name: 'Mad Transit' })).toBeInTheDocument();
      expect(within(screen.getByRole('main')).getByTestId('base-map')).toBeInTheDocument();
    });

    // Bottom sheet below md; DesktopMapPage.test.tsx covers the desktop panel.
    it('puts the list and attribution in the panel', async () => {
      await renderPage();

      const region = panel();
      expect(await within(region).findByRole('region', { name: 'Cercanas' })).toBeInTheDocument();
      expect(within(region).getByRole('link', { name: 'EMT de Madrid' })).toBeInTheDocument();
    });

    it('floats search, mode and recenter over the map, out of the panel', async () => {
      await renderPage();

      const main = within(screen.getByRole('main'));
      const region = within(panel());
      expect(main.getByRole('searchbox', { name: 'Buscar estación' })).toHaveClass('h-11');
      expect(main.getByRole('button', { name: 'Dejar bici' })).toBeInTheDocument();
      expect(main.getByRole('button', { name: 'Centrar en mi posición' })).toBeInTheDocument();
      expect(region.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(region.queryByRole('button', { name: 'Dejar bici' })).not.toBeInTheDocument();
      expect(region.queryByRole('button', { name: 'Mi ubicación' })).not.toBeInTheDocument();
    });

    it.each([
      { isWide: true, description: 'Anclajes libres' },
      { isWide: false, description: '' },
    ])(
      'shows the mode as cards only from md (from md: $isWide)',
      async ({ isWide, description }) => {
        stubMatchMedia(isWide);
        await renderPage();

        expect(screen.getByRole('button', { name: 'Dejar bici' })).toHaveAccessibleDescription(
          description,
        );
      },
    );
  });

  describe('with Bus chosen', () => {
    it('shows the Paradas panel and the service choice, without the stations map or search', async () => {
      await renderPage('/?service=bus');

      expect(screen.getByRole('region', { name: 'Paradas' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Bus' })).toBeChecked();
      expect(screen.queryByTestId('base-map')).not.toBeInTheDocument();
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('brings the stations back when BiciMAD is chosen again, keeping the need', async () => {
      const user = userEvent.setup();
      const { router } = await renderPage('/?service=bus&need=docks');

      await user.click(screen.getByRole('radio', { name: 'BiciMAD' }));

      expect(router.state.location.href).toBe('/?need=docks');
      expect(await screen.findByTestId('base-map')).toBeInTheDocument();
    });
  });

  describe('with the location granted', () => {
    beforeEach(() => stubGeolocation('granted'));

    it('lists the stations near the user (SC1) and centers the map on them', async () => {
      const requests = recordNearbyRequests();

      await renderPage();

      expect(await rowIn('Cercanas', '1a')).toBeInTheDocument();
      expect(screen.getByText('Usando tu ubicación actual.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Activar' })).not.toBeInTheDocument();
      expect(requests[0]?.searchParams.get('near')).toBe('40.4169,-3.7033');
      expect(lastMapProps()).toMatchObject({ focus: USER, userLocation: USER });
    });

    // The user may have moved the map away: an equal position must still bring it back.
    it('brings the map back to the user with "Centrar en mi posición", though the position is the same', async () => {
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');
      mapRenders.length = 0;

      await user.click(recenterButton());

      // The focus is released while asking, so the same answer is a new focus for the map.
      await waitFor(() =>
        expect(lastMapProps()).toMatchObject({ focus: USER, userLocation: USER }),
      );
      expect(mapRenders.some((props) => props.focus === undefined)).toBe(true);
    });

    it('opens ?station=1a in place of the list and selects it on the map (SC5)', async () => {
      await renderPage('/?station=1a');

      expect(await detailTitle('Puerta del Sol A')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Cercanas' })).not.toBeInTheDocument();
      await waitFor(() =>
        expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: PUERTA_DEL_SOL_A }),
      );
    });

    it('centers the map on the user with "Centrar en mi posición" and keeps the station open', async () => {
      const user = userEvent.setup();
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');

      await user.click(recenterButton());

      await waitFor(() => expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: USER }));
      expect(screen.getByRole('heading', { level: 2, name: 'Puerta del Sol A' })).toBeVisible();
    });

    it('focuses the next station chosen after "Centrar en mi posición"', async () => {
      const user = userEvent.setup();
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');
      await user.click(recenterButton());
      await waitFor(() => expect(lastMapProps().focus).toEqual(USER));

      await act(async () => lastMapProps().onSelectPoint?.('1b'));

      await waitFor(() =>
        expect(lastMapProps()).toMatchObject({ selectedId: '1b', focus: PUERTA_DEL_SOL_B }),
      );
    });

    it('focuses the open station again when its point is tapped after recentering', async () => {
      const user = userEvent.setup();
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');
      await user.click(recenterButton());
      await waitFor(() => expect(lastMapProps().focus).toEqual(USER));

      await act(async () => lastMapProps().onSelectPoint?.('1a'));

      expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: PUERTA_DEL_SOL_A });
    });

    it('asks for free docks with "Dejar bici" without going back to loading (SC3)', async () => {
      const requests = recordNearbyRequests();
      const docks = holdDocksResponse();
      const user = userEvent.setup();
      const { router } = await renderPage();
      await rowIn('Cercanas', '1a');

      await user.click(screen.getByRole('button', { name: 'Dejar bici' }));

      expect(router.state.location.href).toBe('/?need=docks');
      await waitFor(() => expect(requests.at(-1)?.searchParams.get('need')).toBe('docks'));
      expect(screen.queryByText(/Cargando estaciones cercanas/)).not.toBeInTheDocument();
      expect(await rowIn('Cercanas', '1a')).toHaveAccessibleName(/12 anclajes libres$/);

      docks.release();
    });

    it('treats an unknown need as bikes', async () => {
      const requests = recordNearbyRequests();

      await renderPage('/?need=xyz');

      expect(await rowIn('Cercanas', '1a')).toHaveAccessibleName(/12 bicis$/);
      expect(screen.getByRole('button', { name: 'Sacar bici' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(requests.map((url) => url.searchParams.get('need'))).toEqual(['bikes']);
    });

    it('returns the focus to the nearby row on Back, though it is also a favorite (SC6)', async () => {
      saveFavorites(['1a']);
      const user = userEvent.setup();
      const { router } = await renderPage();
      await rowIn('Favoritas · 1', '1a');

      await user.click(await rowIn('Cercanas', '1a'));
      expect(await detailTitle('Puerta del Sol A')).toHaveFocus();

      await act(() => router.history.back());

      expect(await rowIn('Cercanas', '1a')).toHaveFocus();
      expect(router.state.location.href).toBe('/');
    });

    it('returns the focus to the favorite row with "Volver a la lista"', async () => {
      saveFavorites(['1a']);
      const user = userEvent.setup();
      await renderPage();

      await user.click(await rowIn('Favoritas · 1', '1a'));
      await detailTitle('Puerta del Sol A');
      await user.click(backButton());

      expect(await rowIn('Favoritas · 1', '1a')).toHaveFocus();
    });

    it('focuses the list heading when the detail was not opened from the list', async () => {
      const user = userEvent.setup();
      await renderPage('/?station=1a');

      await detailTitle('Puerta del Sol A');
      await user.click(backButton());

      expect(await screen.findByRole('heading', { level: 3, name: 'Cercanas' })).toHaveFocus();
    });
  });

  describe('with the location denied', () => {
    it('lists the stations near Puerta del Sol with a notice and centers the map there (SC2)', async () => {
      stubGeolocation('denied');
      const requests = recordNearbyRequests();

      await renderPage();

      expect(await rowIn('Cercanas', '1a')).toBeInTheDocument();
      expect(
        screen.getByText(
          'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol',
        ),
      ).toBeInTheDocument();
      expect(requests[0]?.searchParams.get('near')).toBe('40.4168,-3.7038');
      expect(lastMapProps()).toMatchObject({ focus: MADRID_CENTER, userLocation: undefined });
    });

    // As from md: the browser would not ask a denied permission again.
    it('drops the recenter button', async () => {
      stubGeolocation('denied');
      await renderPage();
      await rowIn('Cercanas', '1a');

      expect(
        screen.queryByRole('button', { name: 'Centrar en mi posición' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('with the location unavailable', () => {
    it('lists the stations near Puerta del Sol with the notice without location', async () => {
      stubGeolocation('unavailable');

      await renderPage();

      expect(await rowIn('Cercanas', '1a')).toBeInTheDocument();
      expect(screen.getByText('Sin tu ubicación: cerca de la Puerta del Sol')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    });

    it('asks again with "Centrar en mi posición"', async () => {
      const geolocation = stubGeolocation('unavailable');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');

      geolocation.answerWith('granted');
      await user.click(recenterButton());

      expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
      expect(await rowIn('Cercanas', '1a')).toBeInTheDocument();
      await waitFor(() => expect(sheetSubtitle()).toHaveTextContent(/^Cerca de ti · /));
      expect(lastMapProps()).toMatchObject({ focus: USER, userLocation: USER });
    });

    it('brings the map back to Puerta del Sol and drops recentering when it is denied', async () => {
      const geolocation = stubGeolocation('unavailable');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');
      mapRenders.length = 0;

      geolocation.answerWith('denied');
      await user.click(recenterButton());

      await waitFor(() => expect(lastMapProps().focus).toEqual(MADRID_CENTER));
      expect(mapRenders.some((props) => props.focus === undefined)).toBe(true);
      expect(
        screen.queryByRole('button', { name: 'Centrar en mi posición' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('while "Centrar en mi posición" asks again', () => {
    it('keeps describing the list it shows: still near Puerta del Sol', async () => {
      const geolocation = stubGeolocation('unavailable');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');

      geolocation.answerWith('pending');
      await user.click(recenterButton());

      expect(recenterButton()).toHaveAttribute('aria-busy', 'true');
      expect(sheetSubtitle()).toHaveTextContent(/^Cerca de la Puerta del Sol · /);
      expect(screen.getByText('Sin tu ubicación: cerca de la Puerta del Sol')).toBeInTheDocument();
      // Without a focus the map stays where it is until the answer arrives.
      expect(lastMapProps().focus).toBeUndefined();
    });
  });

  describe('bottom sheet below md', () => {
    beforeEach(() => stubGeolocation('granted'));

    it('starts at half on the list', async () => {
      await renderPage();

      expect(sheetHandle()).toHaveAttribute('aria-expanded', 'true');
      expect(sheetHandle()).toHaveAccessibleName('Ocultar lista');
    });

    it('starts at half on a station link', async () => {
      await renderPage('/?station=1a');

      expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
      expect(detailHandle()).toHaveAccessibleName('Ocultar detalle');
    });

    // jsdom and Testing Library ignore `inert`, so the tests assert the attribute itself.
    it('hides the list with the handle and shows it again with the strip, both on the body', async () => {
      const user = userEvent.setup();
      await renderPage();
      const bodyId = sheetHandle().getAttribute('aria-controls') ?? '';
      const body = document.getElementById(bodyId);

      await user.click(sheetHandle());
      expect(listStrip()).toHaveAttribute('aria-expanded', 'false');
      expect(listStrip()).toHaveAttribute('aria-controls', bodyId);
      expect(body?.closest('[inert]')).not.toBeNull();

      await user.click(listStrip());
      expect(sheetHandle()).toHaveAttribute('aria-expanded', 'true');
      expect(sheetHandle()).toHaveAttribute('aria-controls', bodyId);
      expect(body?.closest('[inert]')).toBeNull();
    });

    it('shows a station tapped on the map, and the handle and the strip toggle half and hidden', async () => {
      const user = userEvent.setup();
      await renderPage();

      await act(async () => lastMapProps().onSelectPoint?.('1b'));

      expect(await detailTitle('Puerta del Sol B')).toBeInTheDocument();
      expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
      const bodyId = detailHandle().getAttribute('aria-controls');
      await user.click(detailHandle());
      expect(detailStrip()).toHaveAttribute('aria-expanded', 'false');
      expect(detailStrip()).toHaveAttribute('aria-controls', bodyId);
      expect(backButton().closest('[inert]')).not.toBeNull();
      await user.click(detailStrip());
      expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
      expect(backButton().closest('[inert]')).toBeNull();
    });

    // jsdom's 768 px viewport: half covers 430 - 56 px; the hidden strip is below the map.
    it('leaves the map above the sheet to the focus, at half and hidden', async () => {
      const user = userEvent.setup();
      await renderPage();
      expect(lastMapProps().focusPadding).toEqual({ bottom: 374 });

      await user.click(sheetHandle());

      expect(lastMapProps().focusPadding).toEqual({ bottom: 0 });
    });

    // The map ends over the 56 px hidden strip, so 16 px there is 72 px from the screen edge.
    it('keeps the recenter button 16 px above the sheet at both heights', async () => {
      const user = userEvent.setup();
      await renderPage();
      // Absolutely placed, it measures its bottom from the end of its grid area: the map's row
      // only, or the bottom would count the hidden strip too and sit 56 px under the sheet.
      expect(recenterSlot()).toHaveClass('col-start-1', 'row-start-1', 'row-end-2');
      expect(recenterSlot()).toHaveStyle({ bottom: '390px' });

      await user.click(sheetHandle());
      expect(recenterSlot()).toHaveStyle({ bottom: '16px' });

      await user.click(listStrip());
      expect(recenterSlot()).toHaveStyle({ bottom: '390px' });
    });

    it('centers the selected station above the sheet at its current height', async () => {
      const user = userEvent.setup();
      await renderPage();

      await act(async () => lastMapProps().onSelectPoint?.('1b'));
      expect(await detailTitle('Puerta del Sol B')).toBeInTheDocument();
      expect(lastMapProps().focusPadding).toEqual({ bottom: 374 });

      await user.click(detailHandle());
      expect(lastMapProps().focusPadding).toEqual({ bottom: 0 });
      expect(recenterSlot()).toHaveStyle({ bottom: '16px' });
    });

    it('keeps the map on the user after recentering when the sheet changes height', async () => {
      const user = userEvent.setup();
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');
      await user.click(recenterButton());
      await waitFor(() => expect(lastMapProps().focus).toEqual(USER));

      await user.click(detailHandle());

      expect(lastMapProps()).toMatchObject({ focus: USER, focusPadding: { bottom: 0 } });
    });

    it('stays open when a row is chosen', async () => {
      const user = userEvent.setup();
      await renderPage();

      await user.click(await rowIn('Cercanas', '1b'));

      expect(await detailTitle('Puerta del Sol B')).toBeInTheDocument();
      expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // The strip's visible text is its accessible name: each test finds the strip by that name and
  // checks it is also its text.
  describe('hidden sheet strip below md', () => {
    function stripNamed(name: string) {
      return screen.getByRole('button', { name });
    }

    it('counts the nearby stations with bikes, then with free docks, as the mode changes', async () => {
      stubGeolocation('granted');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');

      await user.click(sheetHandle());
      expect(stripNamed('Mostrar lista · 2 estaciones con bicis')).toHaveTextContent(
        /^Mostrar lista · 2 estaciones con bicis$/,
      );
      await user.click(screen.getByRole('button', { name: 'Dejar bici' }));

      expect(
        await screen.findByRole('button', { name: 'Mostrar lista · 2 estaciones con hueco' }),
      ).toHaveTextContent(/^Mostrar lista · 2 estaciones con hueco$/);
    });

    it('names the nearby stations without a count while they load', async () => {
      stubGeolocation('pending');
      const user = userEvent.setup();
      await renderPage();

      await user.click(sheetHandle());

      expect(stripNamed('Mostrar lista · Estaciones cercanas')).toHaveTextContent(
        /^Mostrar lista · Estaciones cercanas$/,
      );
    });

    it('names the open station on one line, cut with an ellipsis if too long', async () => {
      stubGeolocation('granted');
      const user = userEvent.setup();
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');

      await user.click(detailHandle());

      const strip = stripNamed('Mostrar detalle · Puerta del Sol A');
      expect(strip).toHaveTextContent(/^Mostrar detalle · Puerta del Sol A$/);
      expect(strip).not.toHaveAttribute('aria-label');
      expect(within(strip).getByText(/^Mostrar detalle/)).toHaveClass('truncate');
    });

    it('says the station was not found', async () => {
      stubGeolocation('granted');
      const user = userEvent.setup();
      await renderPage('/?station=99');
      await screen.findByText('Estación no encontrada');

      await user.click(detailHandle());

      expect(stripNamed('Mostrar detalle · Estación no encontrada')).toHaveTextContent(
        /^Mostrar detalle · Estación no encontrada$/,
      );
    });

    // Station 99 is not in the full list either, so nothing else can name it. The error shows
    // after the app's one retry, 1 s later.
    it.each([
      ['loads', 'Cargando estación…', () => new Promise<never>(() => {})],
      [
        'failed to load',
        'No se pudo cargar la estación',
        () => problemResponse(internalErrorProblem('/v1/bicimad/stations/99')),
      ],
    ])('names the station by its number while it %s', async (_state, bodyText, resolver) => {
      stubGeolocation('granted');
      server.use(http.get(`${STATIONS_URL}/:number`, resolver));
      const user = userEvent.setup();
      await renderPage('/?station=99');
      await screen.findByText(bodyText, undefined, { timeout: 3_000 });

      await user.click(detailHandle());

      expect(stripNamed('Mostrar detalle · Estación 99')).toHaveTextContent(
        /^Mostrar detalle · Estación 99$/,
      );
    });
  });

  describe('station detail in the sheet below md', () => {
    type User = ReturnType<typeof userEvent.setup>;
    type ListSnap = 'hidden' | 'half';

    beforeEach(() => stubGeolocation('granted'));

    async function moveListTo(user: User, snap: ListSnap) {
      if (snap === 'hidden') await user.click(sheetHandle());
    }

    function listToggle(snap: ListSnap) {
      return snap === 'hidden' ? listStrip() : sheetHandle();
    }

    // The list region keeps the name «Estaciones»; at hidden its rows are inert, so the map opens.
    async function openFromList(user: User, snap: ListSnap) {
      await moveListTo(user, snap);
      if (snap === 'hidden') {
        await act(async () => lastMapProps().onSelectPoint?.('1b'));
        return;
      }
      await user.click(await rowIn('Cercanas', '1b'));
    }

    it.each(['hidden', 'half'] as const)(
      'opens a station tapped on the map at half from %s, without moving the focus',
      async (snap) => {
        const user = userEvent.setup();
        await renderPage();
        await rowIn('Cercanas', '1a');
        await moveListTo(user, snap);
        listToggle(snap).focus();

        await act(async () => lastMapProps().onSelectPoint?.('1b'));

        expect(await detailTitle('Puerta del Sol B')).toBeInTheDocument();
        expect(detailHandle()).toHaveFocus();
        expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
        expect(recenterSlot()).toHaveStyle({ bottom: '390px' });
        expect(lastMapProps().selectedId).toBe('1b');
      },
    );

    // The row unmounts with the list, so the focus would be lost: the station name takes it.
    it('opens a row chosen at half, focusing the station name', async () => {
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');

      await openFromList(user, 'half');

      expect(await detailTitle('Puerta del Sol B')).toHaveFocus();
      expect(detailHandle()).toHaveAccessibleName('Ocultar detalle');
    });

    it('keeps the marker selected while the detail is hidden', async () => {
      const user = userEvent.setup();
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');

      await user.click(detailHandle());

      expect(lastMapProps().selectedId).toBe('1a');
    });

    async function goBack(user: User, way: 'the arrow' | 'Escape') {
      if (way === 'the arrow') {
        await user.click(backButton());
        return;
      }
      within(detailSheet()).getByRole('button', { name: 'Favorita' }).focus();
      await user.keyboard('{Escape}');
    }

    it.each([
      { snap: 'hidden', way: 'the arrow' },
      { snap: 'half', way: 'the arrow' },
      { snap: 'hidden', way: 'Escape' },
      { snap: 'half', way: 'Escape' },
    ] as const)('goes back to the list at $snap with $way, unselected', async ({ snap, way }) => {
      const user = userEvent.setup();
      const { router } = await renderPage();
      await rowIn('Cercanas', '1a');
      await openFromList(user, snap);
      await detailTitle('Puerta del Sol B');

      await goBack(user, way);

      expect(router.state.location.search.station).toBeUndefined();
      expect(lastMapProps().selectedId).toBeUndefined();
      expect(listToggle(snap)).toHaveAttribute('aria-expanded', String(snap === 'half'));
    });

    it.each(['the arrow', 'Escape'] as const)(
      'returns the focus to the row with %s',
      async (way) => {
        const user = userEvent.setup();
        await renderPage();
        await rowIn('Cercanas', '1a');
        await openFromList(user, 'half');
        await detailTitle('Puerta del Sol B');

        await goBack(user, way);

        expect(await rowIn('Cercanas', '1b')).toHaveFocus();
      },
    );

    // At hidden the list is inert, so neither its rows nor its headings can take the focus back.
    it.each(['the arrow', 'Escape', 'Back'] as const)(
      'focuses the strip when %s goes back to the list at hidden',
      async (way) => {
        const user = userEvent.setup();
        const { router } = await renderPage();
        await rowIn('Cercanas', '1a');
        await openFromList(user, 'hidden');
        await detailTitle('Puerta del Sol B');

        if (way === 'Back') await act(() => router.history.back());
        else await goBack(user, way);

        expect(listStrip()).toHaveFocus();
        expect(listStrip()).toHaveAccessibleName('Mostrar lista · 2 estaciones con bicis');
      },
    );

    it('focuses the strip when Back closes a hidden detail over a hidden list', async () => {
      const user = userEvent.setup();
      const { router } = await renderPage();
      await rowIn('Cercanas', '1a');
      await openFromList(user, 'hidden');
      await detailTitle('Puerta del Sol B');
      await user.click(detailHandle());

      await act(() => router.history.back());

      expect(listStrip()).toHaveFocus();
    });

    it('has no axe violations with the detail open, at half and hidden', async () => {
      stubGeolocation('denied');
      const user = userEvent.setup();
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');
      const sheet = detailSheet().parentElement as HTMLElement;

      await expect(expectNoAxeViolations(sheet)).resolves.toBeUndefined();
      await user.click(detailHandle());
      await expect(expectNoAxeViolations(sheet)).resolves.toBeUndefined();
    });
  });

  describe('sheet header below md', () => {
    it('counts the nearby stations with bikes, then with free docks, as the mode changes', async () => {
      stubGeolocation('granted');
      server.use(
        http.get(STATIONS_URL, ({ request }) => {
          const params = new URL(request.url).searchParams;
          if (!params.has('near')) return HttpResponse.json(stationsFixture);
          if (params.get('need') === 'bikes') return HttpResponse.json(nearbyStationsFixture);
          return HttpResponse.json({
            ...nearbyStationsFixture,
            stations: nearbyStationsFixture.stations.map((station) =>
              station.number === '1a' ? { ...station, freeDocks: 0 } : station,
            ),
          });
        }),
      );
      const user = userEvent.setup();
      await renderPage();

      // 1a and 1b have bikes; station 2 is out of service.
      expect(
        await screen.findByRole('heading', { level: 2, name: '2 estaciones con bicis' }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Dejar bici' }));

      expect(
        await screen.findByRole('heading', { level: 2, name: '1 estación con hueco' }),
      ).toBeInTheDocument();
    });

    it('says the list is near the user and how old it is', async () => {
      stubGeolocation('granted');
      await renderPage();
      await rowIn('Cercanas', '1a');

      expect(sheetSubtitle()).toHaveTextContent('Cerca de ti · hace 5 minutos');
    });

    it('says the list is near Puerta del Sol without the location', async () => {
      stubGeolocation('denied');
      await renderPage();
      await rowIn('Cercanas', '1a');

      expect(sheetSubtitle()).toHaveTextContent('Cerca de la Puerta del Sol · hace 5 minutos');
    });

    it('names the nearby stations without a count or an age while they load', async () => {
      stubGeolocation('pending');
      await renderPage();

      expect(
        screen.getByRole('heading', { level: 2, name: 'Estaciones cercanas' }),
      ).toBeInTheDocument();
      expect(sheetSubtitle()).toHaveTextContent(/^Cerca de ti$/);
    });

    // The handle hides the sheet, so the header keeps no control of its own.
    it('heads the list with the count alone, without «Ver todas» or «Ver mapa»', async () => {
      stubGeolocation('granted');
      await renderPage();
      const title = await screen.findByRole('heading', {
        level: 2,
        name: '2 estaciones con bicis',
      });

      expect(within(title.parentElement as HTMLElement).queryAllByRole('button')).toEqual([]);
      expect(screen.queryByRole('button', { name: /^Ver (todas|mapa)$/ })).not.toBeInTheDocument();
    });

    it('leaves the header out while a station is open', async () => {
      stubGeolocation('granted');
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');

      expect(screen.queryByRole('button', { name: 'Ver todas' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /estaciones con/ })).not.toBeInTheDocument();
    });

    it('has no axe violations in the sheet with its header, at half and hidden', async () => {
      stubGeolocation('denied');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');
      const sheet = panel().parentElement as HTMLElement;

      await expect(expectNoAxeViolations(sheet)).resolves.toBeUndefined();
      await user.click(sheetHandle());
      await expect(expectNoAxeViolations(sheet)).resolves.toBeUndefined();
    });
  });

  describe('side panel from md', () => {
    beforeEach(() => {
      stubGeolocation('granted');
      stubMatchMedia(true);
    });

    it('centers the selected station clear of the card, the panel covers none of it', async () => {
      await renderPage('/?station=1a');

      expect(await rowIn('Cerca de ti', '1a')).toBeInTheDocument();
      expect(lastMapProps().focusPadding).toEqual({ bottom: 0, right: 352 });
    });
  });
});
