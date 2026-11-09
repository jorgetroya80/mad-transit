import { onlineManager } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import type { Coordinates } from '@/entities/station';
import { http, HttpResponse } from 'msw';
import { staleStationsFixture, stationsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import type * as SharedUi from '@/shared/ui';
import type { MapPoint } from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { StationsMap } from './StationsMap';

type CapturedMapProps = {
  points?: readonly MapPoint[];
  selectedId?: string;
  onSelectPoint?: (id: string) => void;
  focus?: { lng: number; lat: number };
  userLocation?: { lng: number; lat: number };
  focusPadding?: { bottom: number };
  controls?: { onRecenter?: () => void; isRecentering?: boolean };
  className?: string;
};

const mapRenders = vi.hoisted(() => [] as CapturedMapProps[]);

// jsdom has no WebGL: the map only records the props it receives.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: (props: CapturedMapProps) => {
    mapRenders.push(props);
    return <div data-testid="base-map" className={props.className} />;
  },
}));

// The fixtures' data is 5 min old here, still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');
const SOL: Coordinates = { lat: 40.41702, lng: -3.70243 };
const USER: Coordinates = { lat: 40.42, lng: -3.7 };
// Station 1a in the fixtures.
const PUERTA_DEL_SOL_A: Coordinates = { lat: 40.4170224, lng: -3.7024255 };
const STATION_COUNT = stationsFixture.stations.length;
const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const UNAVAILABLE = 503;
const SERVICE_NOTICE = 'Las estaciones aparecerán aquí cuando se recupere el servicio';
const OFFLINE_TEXT = 'El mapa no se puede cargar sin conexión';

// Taps a point the way MapLibre would, letting the navigation settle inside `act`.
async function tapPoint(id: string) {
  const { onSelectPoint } = lastMapProps();
  await act(async () => onSelectPoint?.(id));
}

function lastMapProps(): CapturedMapProps {
  const props = mapRenders.at(-1);
  if (!props) throw new Error('BaseMap was not rendered');
  return props;
}

async function waitForPoints() {
  await waitFor(() => expect(lastMapProps().points).toHaveLength(STATION_COUNT));
}

function renderMap(initialEntry = '/', { center }: { center?: Coordinates } = { center: SOL }) {
  return renderWithRouter(<StationsMap layout="desktop" center={center} userLocation={USER} />, {
    initialEntries: [initialEntry],
  });
}

function failStations() {
  server.use(
    http.get(STATIONS_URL, () =>
      HttpResponse.json(
        { title: 'Service Unavailable', status: UNAVAILABLE },
        { status: UNAVAILABLE },
      ),
    ),
  );
}

beforeEach(() => {
  mapRenders.length = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  onlineManager.setOnline(true);
});

describe('StationsMap', () => {
  it('renders the map before the stations arrive', async () => {
    await renderMap();

    expect(screen.getByTestId('base-map')).toBeInTheDocument();
    expect(mapRenders[0]?.points).toEqual([]);
  });

  it('shows every station with its bikes by default', async () => {
    await renderMap();
    await waitForPoints();

    expect(lastMapProps().points?.map(({ id, label, tone }) => ({ id, label, tone }))).toEqual([
      { id: '1a', label: '12', tone: 'good' },
      { id: '1b', label: '2', tone: 'low' },
      { id: '2', label: '–', tone: 'off' },
      { id: '3', label: '0', tone: 'empty' },
    ]);
  });

  it('shows the free docks with ?need=docks', async () => {
    await renderMap('/?need=docks');
    await waitForPoints();

    expect(lastMapProps().points?.map(({ id, label, tone }) => ({ id, label, tone }))).toEqual([
      { id: '1a', label: '12', tone: 'good' },
      { id: '1b', label: '22', tone: 'good' },
      { id: '2', label: '–', tone: 'off' },
      { id: '3', label: '18', tone: 'good' },
    ]);
  });

  it('selects and centers on the station in ?station, whatever its case', async () => {
    await renderMap('/?station=1A');
    await waitForPoints();

    expect(lastMapProps()).toMatchObject({
      selectedId: '1a',
      focus: PUERTA_DEL_SOL_A,
    });
  });

  it('centers on the given center without a selected station', async () => {
    await renderMap();
    await waitForPoints();

    expect(lastMapProps()).toMatchObject({ selectedId: undefined, focus: SOL });
  });

  it('centers on the given center while ?station is not among the stations', async () => {
    await renderMap('/?station=999');
    await waitForPoints();

    expect(lastMapProps()).toMatchObject({ selectedId: undefined, focus: SOL });
  });

  it('centers on the given center, keeping the selection, when the selected station is not the focus', async () => {
    await renderWithRouter(
      <StationsMap layout="desktop" center={SOL} userLocation={USER} focusSelected={false} />,
      {
        initialEntries: ['/?station=1a'],
      },
    );
    await waitForPoints();

    expect(lastMapProps()).toMatchObject({ selectedId: '1a', focus: SOL });
  });

  it('does not move the map before there is a center', async () => {
    await renderMap('/', {});
    await waitForPoints();

    expect(lastMapProps().focus).toBeUndefined();
  });

  it('passes the user location through', async () => {
    await renderMap();

    expect(lastMapProps().userLocation).toEqual(USER);
  });

  it('passes the focus padding through', async () => {
    await renderWithRouter(
      <StationsMap
        layout="desktop"
        center={SOL}
        userLocation={USER}
        focusPadding={{ bottom: 400 }}
      />,
    );

    expect(lastMapProps().focusPadding).toEqual({ bottom: 400 });
  });

  it('passes the map controls through', async () => {
    const controls = { onRecenter: vi.fn<() => void>(), isRecentering: true };
    await renderWithRouter(
      <StationsMap layout="desktop" center={SOL} userLocation={USER} controls={controls} />,
    );

    expect(lastMapProps().controls).toBe(controls);
  });

  it('selects the station of the tapped point', async () => {
    const { router } = await renderMap('/?need=docks');
    await waitForPoints();

    await tapPoint('2');

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ need: 'docks', station: '2' }),
    );
  });

  it('tells about the tapped point, even the station already selected', async () => {
    const onSelect = vi.fn<(number: string) => void>();
    await renderWithRouter(
      <StationsMap layout="desktop" center={SOL} userLocation={USER} onSelect={onSelect} />,
      {
        initialEntries: ['/?station=1a'],
      },
    );
    await waitForPoints();

    await tapPoint('1a');

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('1a');
  });

  it('keeps the same points when only the selection changes', async () => {
    await renderMap();
    await waitForPoints();
    const { points } = lastMapProps();

    await tapPoint('1b');
    await waitFor(() => expect(lastMapProps().selectedId).toBe('1b'));

    expect(lastMapProps().points).toBe(points);
  });

  it('greys every point out when the data is not confirmed', async () => {
    server.use(http.get(STATIONS_URL, () => HttpResponse.json(staleStationsFixture)));

    await renderMap();
    await waitForPoints();

    expect(lastMapProps().points?.every(({ tone }) => tone === 'unconfirmed')).toBe(true);
  });

  describe('notices over the map', () => {
    it('says where the stations will be when the service fails without data, letting taps through', async () => {
      failStations();
      await renderMap();

      const notice = await screen.findByText(SERVICE_NOTICE);

      expect(notice.closest('.pointer-events-none')).not.toBeNull();
      expect(notice.closest('[role="status"], [role="alert"], [aria-live]')).toBeNull();
      expect(screen.queryByText(OFFLINE_TEXT)).not.toBeInTheDocument();
    });

    it('covers the map offline without data, with no word about the list', async () => {
      onlineManager.setOnline(false);
      await renderMap();

      const layer = screen.getByRole('status');
      expect(layer).toHaveTextContent(OFFLINE_TEXT);
      expect(layer).not.toHaveTextContent('Puedes seguir consultando');
      expect(screen.queryByText(SERVICE_NOTICE)).not.toBeInTheDocument();
    });

    it.each([
      { layout: 'desktop', hint: 'Puedes seguir consultando la lista de la izquierda.' },
      { layout: 'mobile', hint: 'Puedes seguir consultando la lista de abajo.' },
    ] as const)('points to the list offline with data on $layout', async ({ layout, hint }) => {
      await renderWithRouter(<StationsMap layout={layout} center={SOL} userLocation={USER} />);
      await waitForPoints();

      act(() => onlineManager.setOnline(false));

      const layer = screen.getByRole('status');
      expect(within(layer).getByText(OFFLINE_TEXT)).toBeInTheDocument();
      expect(within(layer).getByText(hint)).toBeInTheDocument();
    });

    it('drops the layer when the connection returns, keeping the same map', async () => {
      await renderMap();
      await waitForPoints();
      const map = screen.getByTestId('base-map');

      act(() => onlineManager.setOnline(false));
      expect(screen.getByRole('status')).toHaveTextContent(OFFLINE_TEXT);
      act(() => onlineManager.setOnline(true));

      expect(screen.queryByText(OFFLINE_TEXT)).not.toBeInTheDocument();
      expect(screen.getByTestId('base-map')).toBe(map);
    });

    it('shows no notice with data online', async () => {
      await renderMap();
      await waitForPoints();

      expect(screen.queryByText(SERVICE_NOTICE)).not.toBeInTheDocument();
      expect(screen.queryByText(OFFLINE_TEXT)).not.toBeInTheDocument();
    });

    it('has no axe violations with the offline layer', async () => {
      onlineManager.setOnline(false);
      const { container } = await renderMap();

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
});
