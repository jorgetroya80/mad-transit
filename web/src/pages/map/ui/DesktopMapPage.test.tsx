import { onlineManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/api/mocks/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { env, FAVORITES_STORAGE_KEY } from '@/shared/config';
import type * as SharedUi from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { stubMatchMedia } from '../../../../test/matchMedia';
import { renderWithRouter } from '../../../../test/renderWithRouter';

type CapturedMapProps = {
  label?: string;
  className?: string;
  selectedId?: string;
  onSelectPoint?: (id: string) => void;
  focus?: { lng: number; lat: number };
  focusPadding?: { bottom: number; right?: number };
  controls?: { onRecenter?: () => void; isRecentering?: boolean };
};

const mapRenders = vi.hoisted(() => [] as CapturedMapProps[]);

// jsdom has no WebGL: the map is only its named container, with one button standing for its
// recenter control, and records the props it receives.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: (props: CapturedMapProps) => {
    mapRenders.push(props);
    return (
      <section aria-label={props.label} className={props.className}>
        {props.controls?.onRecenter ? (
          <button type="button" onClick={props.controls.onRecenter}>
            Centrar en mi posición
          </button>
        ) : null}
      </section>
    );
  },
}));

function lastMapProps(): CapturedMapProps {
  const props = mapRenders.at(-1);
  if (!props) throw new Error('BaseMap was not rendered');
  return props;
}

async function nearbyRow(number: string) {
  const nearby = await within(panel()).findByRole('region', { name: 'Cerca de ti' });
  return within(nearby).findByRole('button', { name: new RegExp(`^Estación ${number},`) });
}

function currentRows() {
  return Array.from(document.querySelectorAll<HTMLElement>('[aria-current="true"]'));
}

const USER = { lat: 40.4169, lng: -3.7033 };
// Station 1a in the fixtures.
const PUERTA_DEL_SOL_A = { lat: 40.4170224, lng: -3.7024255 };
// The fixtures' data is 5 min old here, still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');

function stubGrantedLocation() {
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((onSuccess) =>
    onSuccess({ coords: { latitude: USER.lat, longitude: USER.lng } } as GeolocationPosition),
  );
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
}

const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;

function stubDeniedLocation() {
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((_, onError) =>
    onError?.({ code: PERMISSION_DENIED, PERMISSION_DENIED } as GeolocationPositionError),
  );
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
}

// The first request fails as if the position were unavailable; the next ones find the user.
function stubLocationAfterRetry() {
  stubGrantedLocation();
  vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementationOnce((_, onError) =>
    onError?.({ code: POSITION_UNAVAILABLE } as GeolocationPositionError),
  );
  return navigator.geolocation.getCurrentPosition;
}

// The first request fails as if the position were unavailable; the next one never answers.
function stubLocationPendingAfterRetry() {
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>();
  getCurrentPosition.mockImplementationOnce((_, onError) =>
    onError?.({ code: POSITION_UNAVAILABLE } as GeolocationPositionError),
  );
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
}

// Tabs from the start of the page through every stop, until the focus leaves the page.
async function tabStops(): Promise<Element[]> {
  const stops: Element[] = [];
  for (;;) {
    await userEvent.tab();
    const focused = document.activeElement;
    if (!focused || focused === document.body || stops.includes(focused)) return stops;
    stops.push(focused);
  }
}

function renderPage(initialEntry = '/') {
  return renderWithRouter(undefined, { initialEntries: [initialEntry] });
}

function panel() {
  return screen.getByRole('region', { name: 'Estaciones' });
}

describe('DesktopMapPage', () => {
  let media: ReturnType<typeof stubMatchMedia>;

  beforeEach(() => {
    mapRenders.length = 0;
    media = stubMatchMedia(true);
    stubGrantedLocation();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'geolocation');
  });

  it('shows the brand and the data freshness in a header above the panel and the map', async () => {
    await renderPage();

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1, name: 'Mad Transit' })).toBeVisible();
    expect(await within(header).findByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(screen.getByRole('main')).getByRole('region', { name: 'Estaciones' })).toBe(
      panel(),
    );
  });

  it('puts search, mode cards, list and attribution in a 420 px panel', async () => {
    await renderPage();

    const region = panel();
    expect(region).toHaveClass('w-105');
    expect(within(region).getByRole('searchbox')).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Dejar bici' })).toHaveAccessibleDescription(
      'Anclajes libres',
    );
    expect(await within(region).findByRole('region', { name: 'Cerca de ti' })).toBeInTheDocument();
    expect(within(region).getByRole('link', { name: 'EMT de Madrid' })).toBeInTheDocument();
    expect(within(region).queryByRole('button', { name: 'Mi ubicación' })).not.toBeInTheDocument();
  });

  it('ends the panel with the availability legend, before the attribution', async () => {
    await renderPage();

    const legend = within(panel()).getByRole('list', { name: 'Leyenda' });
    const attribution = within(panel()).getByRole('link', { name: 'EMT de Madrid' });
    expect(legend.compareDocumentPosition(attribution)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      (await within(panel()).findByRole('region', { name: 'Cerca de ti' })).compareDocumentPosition(
        legend,
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('keeps the list in the panel with a station selected, without its detail', async () => {
    await renderPage('/?station=1a');

    const nearby = await within(panel()).findByRole('region', { name: 'Cerca de ti' });
    expect(
      await within(nearby).findByRole('button', { name: /^Estación 1a,/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: '1a · Puerta del Sol A' }),
    ).not.toBeInTheDocument();
  });

  it('marks the row chosen in the list', async () => {
    await renderPage();

    await userEvent.click(await nearbyRow('1b'));

    expect(await nearbyRow('1b')).toHaveAttribute('aria-current', 'true');
    expect(currentRows()).toEqual([await nearbyRow('1b')]);
  });

  it('marks the same row when the station is chosen on the map', async () => {
    await renderPage();
    await nearbyRow('1b');

    await act(async () => lastMapProps().onSelectPoint?.('1b'));

    expect(currentRows()).toEqual([await nearbyRow('1b')]);
  });

  it('centers the map clear of the station card on its right', async () => {
    await renderPage('/?station=1a');
    await nearbyRow('1a');

    expect(lastMapProps().focusPadding).toEqual({ bottom: 0, right: 352 });
  });

  it('opens the station card over the map, leaving the focus on the row', async () => {
    await renderPage();
    const row = await nearbyRow('1b');

    await userEvent.click(row);

    const card = await screen.findByRole('region', { name: 'Puerta del Sol B' });
    const map = screen.getByRole('region', { name: 'Mapa de estaciones' });
    // The map sits in StationsMap's own box, next to its notices; the card shares the area above.
    expect(map.parentElement?.parentElement).toContainElement(card);
    expect(panel()).not.toContainElement(card);
    expect(row).toHaveFocus();
  });

  it.each([
    {
      how: '«Cerrar»',
      close: () => userEvent.click(screen.getByRole('button', { name: 'Cerrar' })),
    },
    { how: 'Escape', close: () => userEvent.keyboard('{Escape}') },
  ])('closes the card with $how and focuses its row again', async ({ close }) => {
    const { router } = await renderPage();
    await userEvent.click(await nearbyRow('1b'));
    screen.getByRole('button', { name: 'Cerrar' }).focus();

    await close();

    expect(router.state.location.search.station).toBeUndefined();
    expect(screen.queryByRole('region', { name: 'Puerta del Sol B' })).not.toBeInTheDocument();
    expect(await nearbyRow('1b')).toHaveFocus();
  });

  it('tells the list is around the user, sorted by distance', async () => {
    await renderPage();

    const nearby = await within(panel()).findByRole('region', { name: 'Cerca de ti' });
    expect(nearby).toHaveAccessibleDescription('Ordenadas por distancia');
    expect(within(panel()).getByText('Usando tu ubicación actual.')).toBeInTheDocument();
  });

  it('asks for the position again from the location notice', async () => {
    const getCurrentPosition = stubLocationAfterRetry();
    await renderPage();
    await within(panel()).findByRole('region', { name: 'Cerca de la Puerta del Sol' });

    await userEvent.click(within(panel()).getByRole('button', { name: 'Usar mi ubicación' }));

    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(await within(panel()).findByRole('region', { name: 'Cerca de ti' })).toBeVisible();
    expect(within(panel()).getByText('Usando tu ubicación actual.')).toBeInTheDocument();
  });

  it('says it is locating while the notice asks for the position', async () => {
    stubLocationPendingAfterRetry();
    await renderPage();
    await within(panel()).findByRole('region', { name: 'Cerca de la Puerta del Sol' });

    await userEvent.click(within(panel()).getByRole('button', { name: 'Usar mi ubicación' }));

    expect(within(panel()).getByRole('button', { name: 'Localizando…' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      within(panel()).getByRole('region', { name: 'Cerca de la Puerta del Sol' }),
    ).toBeVisible();
  });

  it('recenters the map on the user by asking for the position again', async () => {
    const getCurrentPosition = stubLocationAfterRetry();
    await renderPage();
    await within(panel()).findByRole('region', { name: 'Cerca de la Puerta del Sol' });

    await act(async () => lastMapProps().controls?.onRecenter?.());

    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(await within(panel()).findByRole('region', { name: 'Cerca de ti' })).toBeVisible();
  });

  it('centers the map on the user with «Centrar en mi posición» and keeps the card open', async () => {
    await renderPage('/?station=1a');
    const card = await screen.findByRole('region', { name: 'Puerta del Sol A' });
    await waitFor(() =>
      expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: PUERTA_DEL_SOL_A }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Centrar en mi posición' }));

    await waitFor(() => expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: USER }));
    expect(card).toBeVisible();
  });

  it('centers the map on the user with «Usar mi ubicación» and keeps the card open', async () => {
    stubLocationAfterRetry();
    await renderPage('/?station=1a');
    const card = await screen.findByRole('region', { name: 'Puerta del Sol A' });
    await within(panel()).findByRole('region', { name: 'Cerca de la Puerta del Sol' });

    await userEvent.click(within(panel()).getByRole('button', { name: 'Usar mi ubicación' }));

    await waitFor(() => expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: USER }));
    expect(card).toBeVisible();
  });

  it('focuses the open station again when its point is tapped after recentering', async () => {
    await renderPage('/?station=1a');
    await screen.findByRole('region', { name: 'Puerta del Sol A' });
    await userEvent.click(screen.getByRole('button', { name: 'Centrar en mi posición' }));
    await waitFor(() => expect(lastMapProps().focus).toEqual(USER));

    await act(async () => lastMapProps().onSelectPoint?.('1a'));

    expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: PUERTA_DEL_SOL_A });
  });

  it('marks the recenter control busy while locating', async () => {
    stubLocationPendingAfterRetry();
    await renderPage();
    await within(panel()).findByRole('region', { name: 'Cerca de la Puerta del Sol' });
    expect(lastMapProps().controls).toMatchObject({ isRecentering: false });

    await userEvent.click(within(panel()).getByRole('button', { name: 'Usar mi ubicación' }));

    expect(lastMapProps().controls).toMatchObject({ isRecentering: true });
  });

  it('keeps the zoom controls but drops recentering when the location is denied', async () => {
    stubDeniedLocation();
    await renderPage();
    await within(panel()).findByRole('region', { name: 'Cerca de la Puerta del Sol' });

    expect(lastMapProps().controls).toBeDefined();
    expect(lastMapProps().controls?.onRecenter).toBeUndefined();
    expect(
      screen.queryByRole('button', { name: 'Centrar en mi posición' }),
    ).not.toBeInTheDocument();
  });

  it('names the map after the stations', async () => {
    await renderPage();

    expect(
      within(screen.getByRole('main')).getByRole('region', { name: 'Mapa de estaciones' }),
    ).toBeInTheDocument();
  });

  it('switches to the bottom sheet below md', async () => {
    await renderPage();

    act(() => media.change(false));

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar lista' })).toBeInTheDocument();
  });

  it('tabs through search, mode, location notice, favorites, list, map and card in order', async () => {
    stubLocationAfterRetry();
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['1b']));
    await renderPage('/?station=1a');
    const nearby = await within(panel()).findByRole('region', {
      name: 'Cerca de la Puerta del Sol',
    });
    const card = await screen.findByRole('region', { name: 'Puerta del Sol A' });
    const expectedOrder = [
      within(panel()).getByRole('searchbox'),
      within(panel()).getByRole('button', { name: 'Sacar bici' }),
      within(panel()).getByRole('button', { name: 'Usar mi ubicación' }),
      within(panel()).getByRole('button', { name: 'Favoritas · 1' }),
      (await within(nearby).findAllByRole('button', { name: /^Estación/ }))[0],
      screen.getByRole('button', { name: 'Centrar en mi posición' }),
      within(card).getByRole('button', { name: 'Cerrar' }),
    ];

    const stops = await tabStops();

    const positions = expectedOrder.map((element) => stops.indexOf(element as Element));
    expect(positions).not.toContain(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('has no axe violations', async () => {
    const { container } = await renderPage('/?station=1a');
    await within(panel()).findByRole('region', { name: 'Cerca de ti' });
    await screen.findByRole('region', { name: 'Puerta del Sol A' });

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
  describe('without data', () => {
    afterEach(() => onlineManager.setOnline(true));

    it('says it needs the connection, with the search off and the map covered (SC2)', async () => {
      onlineManager.setOnline(false);
      const { container } = await renderPage();

      const [alert, ...otherAlerts] = await screen.findAllByRole('alert');
      expect(otherAlerts).toEqual([]);
      expect(alert).toHaveTextContent('Sin conexión a internet');
      expect(screen.getByRole('searchbox', { name: 'Buscar estación' })).toBeDisabled();
      expect(screen.getByRole('searchbox', { name: 'Buscar estación' })).toHaveAttribute(
        'placeholder',
        'Disponible al volver a conectarte',
      );
      expect(
        screen.getByText('El mapa no se puede cargar sin conexión').closest('output'),
      ).toHaveRole('status');
      expect(within(panel()).queryByRole('button', { name: 'Reintentar' })).toBeNull();
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });

    it('says the service fails, with the search off and a notice over the map (SC1)', async () => {
      server.use(
        http.get(`${env.apiBaseUrl}/v1/bicimad/stations`, () =>
          HttpResponse.json({ title: 'Service Unavailable', status: 503 }, { status: 503 }),
        ),
      );
      const { container } = await renderPage();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No podemos cargar las estaciones',
      );
      expect(screen.getByRole('searchbox', { name: 'Buscar estación' })).toHaveAttribute(
        'placeholder',
        'No disponible hasta recuperar los datos',
      );
      expect(
        screen.getByText('Las estaciones aparecerán aquí cuando se recupere el servicio'),
      ).toBeInTheDocument();
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
});
