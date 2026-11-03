import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { nearbyStationsFixture, stationsFixture } from '@/shared/api/mocks/fixtures';
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
  return screen.getByRole('button', { name: /^(Ampliar|Reducir) lista$/ });
}

function detailHandle() {
  return screen.getByRole('button', { name: /^(Ampliar|Reducir) detalle$/ });
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

function sheetSnapButton() {
  return screen.getByRole('button', { name: /^Ver (todas|mapa)$/ });
}

function recenterButton() {
  return screen.getByRole('button', { name: 'Centrar en mi posición' });
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
      expect(main.getByRole('searchbox', { name: 'Buscar estación' })).toHaveClass('h-12.5');
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

    it('asks again with "Centrar en mi posición"', async () => {
      const geolocation = stubGeolocation('denied');
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

    it('brings the map back to Puerta del Sol when recentering is denied again', async () => {
      stubGeolocation('denied');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');
      mapRenders.length = 0;

      await user.click(recenterButton());

      await waitFor(() => expect(lastMapProps().focus).toEqual(MADRID_CENTER));
      expect(mapRenders.some((props) => props.focus === undefined)).toBe(true);
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
  });

  describe('while "Centrar en mi posición" asks again', () => {
    it('keeps describing the list it shows: still near Puerta del Sol', async () => {
      const geolocation = stubGeolocation('denied');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');

      geolocation.answerWith('pending');
      await user.click(recenterButton());

      expect(recenterButton()).toHaveAttribute('aria-busy', 'true');
      expect(sheetSubtitle()).toHaveTextContent(/^Cerca de la Puerta del Sol · /);
      expect(
        screen.getByText(
          'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol',
        ),
      ).toBeInTheDocument();
      // Without a focus the map stays where it is until the answer arrives.
      expect(lastMapProps().focus).toBeUndefined();
    });
  });

  describe('bottom sheet below md', () => {
    beforeEach(() => stubGeolocation('granted'));

    it('starts at half on the list', async () => {
      await renderPage();

      expect(sheetHandle()).toHaveAttribute('aria-expanded', 'true');
      expect(sheetHandle()).toHaveAccessibleName('Ampliar lista');
    });

    it('starts at half on a station link', async () => {
      await renderPage('/?station=1a');

      expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
      expect(detailHandle()).toHaveAccessibleName('Reducir detalle');
    });

    it('shows a station tapped on the map, and the handle toggles half and peek', async () => {
      const user = userEvent.setup();
      await renderPage();

      await act(async () => lastMapProps().onSelectPoint?.('1b'));

      expect(await detailTitle('Puerta del Sol B')).toBeInTheDocument();
      expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
      expect(detailHandle()).toHaveAccessibleName('Reducir detalle');
      await user.click(detailHandle());
      expect(detailHandle()).toHaveAccessibleName('Ampliar detalle');
      expect(detailHandle()).toHaveAttribute('aria-expanded', 'false');
      expect(
        within(detailSheet()).getByRole('button', { name: 'Volver a la lista' }),
      ).toBeVisible();
      await user.click(detailHandle());
      expect(detailHandle()).toHaveAccessibleName('Reducir detalle');
      expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
    });

    // jsdom's 768 px viewport: half covers 430 - 112 px and full min(700, 768 - 144) - 112 px.
    it('leaves the map above the half sheet to the focus', async () => {
      await renderPage();

      expect(lastMapProps().focusPadding).toEqual({ bottom: 318 });
    });

    it('keeps the recenter button 16 px above the sheet and hides it at full', async () => {
      const user = userEvent.setup();
      await renderPage();
      expect(recenterButton()).toHaveStyle({ bottom: '334px' });

      await user.click(sheetHandle());
      expect(
        screen.queryByRole('button', { name: 'Centrar en mi posición' }),
      ).not.toBeInTheDocument();

      await user.click(sheetHandle());
      expect(recenterButton()).toHaveStyle({ bottom: '334px' });
    });

    it('centers the selected station above the sheet at its current height', async () => {
      const user = userEvent.setup();
      await renderPage();

      await act(async () => lastMapProps().onSelectPoint?.('1b'));
      expect(await detailTitle('Puerta del Sol B')).toBeInTheDocument();
      expect(lastMapProps().focusPadding).toEqual({ bottom: 318 });

      await user.click(detailHandle());
      expect(lastMapProps().focusPadding).toEqual({ bottom: 0 });
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

  describe('station detail in the sheet below md', () => {
    type User = ReturnType<typeof userEvent.setup>;
    type ListSnap = 'peek' | 'half' | 'full';

    beforeEach(() => stubGeolocation('granted'));

    // «Ver todas» takes the list to full, and «Ver mapa» from there to peek.
    async function moveListTo(user: User, snap: ListSnap) {
      if (snap === 'half') return;
      await user.click(sheetSnapButton());
      if (snap === 'peek') await user.click(sheetSnapButton());
    }

    // The list region keeps the name «Estaciones»; at peek its rows are inert, so the map opens.
    async function openFromList(user: User, snap: ListSnap) {
      await moveListTo(user, snap);
      if (snap === 'peek') {
        await act(async () => lastMapProps().onSelectPoint?.('1b'));
        return;
      }
      await user.click(await rowIn('Cercanas', '1b'));
    }

    it.each(['peek', 'half', 'full'] as const)(
      'opens a station tapped on the map at half from %s, without moving the focus',
      async (snap) => {
        const user = userEvent.setup();
        await renderPage();
        await rowIn('Cercanas', '1a');
        await moveListTo(user, snap);
        sheetHandle().focus();

        await act(async () => lastMapProps().onSelectPoint?.('1b'));

        expect(await detailTitle('Puerta del Sol B')).toBeInTheDocument();
        expect(detailHandle()).toHaveFocus();
        expect(detailHandle()).toHaveAttribute('aria-expanded', 'true');
        expect(recenterButton()).toHaveStyle({ bottom: '334px' });
        expect(lastMapProps().selectedId).toBe('1b');
      },
    );

    // The row unmounts with the list, so the focus would be lost: the station name takes it.
    it.each(['half', 'full'] as const)(
      'opens a row chosen with the list at %s at half, focusing the station name',
      async (snap) => {
        const user = userEvent.setup();
        await renderPage();
        await rowIn('Cercanas', '1a');

        await openFromList(user, snap);

        expect(await detailTitle('Puerta del Sol B')).toHaveFocus();
        expect(detailHandle()).toHaveAccessibleName('Reducir detalle');
        expect(
          screen.queryByRole('button', { name: /^Ver (todas|mapa)$/ }),
        ).not.toBeInTheDocument();
      },
    );

    it('keeps the marker selected while the detail is at peek', async () => {
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
      { snap: 'peek', way: 'the arrow' },
      { snap: 'full', way: 'the arrow' },
      { snap: 'peek', way: 'Escape' },
      { snap: 'full', way: 'Escape' },
    ] as const)('goes back to the list at $snap with $way, unselected', async ({ snap, way }) => {
      const user = userEvent.setup();
      const { router } = await renderPage();
      await rowIn('Cercanas', '1a');
      await openFromList(user, snap);
      await detailTitle('Puerta del Sol B');
      await user.click(detailHandle());

      await goBack(user, way);

      expect(router.state.location.search.station).toBeUndefined();
      expect(lastMapProps().selectedId).toBeUndefined();
      expect(sheetHandle()).toHaveAttribute('aria-expanded', String(snap !== 'peek'));
      expect(sheetHandle()).toHaveAccessibleName(
        snap === 'full' ? 'Reducir lista' : 'Ampliar lista',
      );
    });

    it.each(['the arrow', 'Escape'] as const)(
      'returns the focus to the row with %s',
      async (way) => {
        const user = userEvent.setup();
        await renderPage();
        await rowIn('Cercanas', '1a');
        await openFromList(user, 'full');
        await detailTitle('Puerta del Sol B');

        await goBack(user, way);

        expect(await rowIn('Cercanas', '1b')).toHaveFocus();
      },
    );

    // At peek the list is inert, so neither its rows nor its headings can take the focus back.
    it.each(['the arrow', 'Escape', 'Back'] as const)(
      'focuses the handle when %s goes back to the list at peek',
      async (way) => {
        const user = userEvent.setup();
        const { router } = await renderPage();
        await rowIn('Cercanas', '1a');
        await openFromList(user, 'peek');
        await detailTitle('Puerta del Sol B');

        if (way === 'Back') await act(() => router.history.back());
        else await goBack(user, way);

        expect(sheetHandle()).toHaveFocus();
        expect(sheetHandle()).toHaveAccessibleName('Ampliar lista');
      },
    );

    it('has no axe violations with the detail open, at half and peek', async () => {
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

    it('opens the sheet to full with «Ver todas» and down to peek with «Ver mapa»', async () => {
      stubGeolocation('granted');
      const user = userEvent.setup();
      await renderPage();
      const chevron = () => sheetSnapButton().querySelector('svg');

      expect(sheetSnapButton()).toHaveAccessibleName('Ver todas');
      expect(sheetSnapButton()).toHaveAttribute(
        'aria-controls',
        sheetHandle().getAttribute('aria-controls'),
      );
      // ChevronIcon points down: «Ver todas» shows it up, as the design does.
      expect(chevron()).toHaveClass('rotate-180');
      expect(chevron()).toHaveClass('duration-320', 'ease-sheet', 'motion-reduce:transition-none');

      await user.click(sheetSnapButton());
      expect(sheetHandle()).toHaveAccessibleName('Reducir lista');
      expect(sheetSnapButton()).toHaveAccessibleName('Ver mapa');
      expect(chevron()).not.toHaveClass('rotate-180');

      await user.click(sheetSnapButton());
      expect(sheetHandle()).toHaveAttribute('aria-expanded', 'false');
      expect(sheetSnapButton()).toHaveAccessibleName('Ver todas');

      await user.click(sheetSnapButton());
      expect(sheetHandle()).toHaveAccessibleName('Reducir lista');
    });

    it('leaves the header out while a station is open', async () => {
      stubGeolocation('granted');
      await renderPage('/?station=1a');
      await detailTitle('Puerta del Sol A');

      expect(screen.queryByRole('button', { name: 'Ver todas' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /estaciones con/ })).not.toBeInTheDocument();
    });

    it('has no axe violations in the sheet with its header, at half and full', async () => {
      stubGeolocation('denied');
      const user = userEvent.setup();
      await renderPage();
      await rowIn('Cercanas', '1a');
      const sheet = panel().parentElement as HTMLElement;

      await expect(expectNoAxeViolations(sheet)).resolves.toBeUndefined();
      await user.click(sheetSnapButton());
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
