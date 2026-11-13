import { act, waitFor } from '@testing-library/react';
import type { BusStopDetailResponse, BusStopsResponse } from '@jorgetroya80/mad-transit-client';
import { http, HttpResponse } from 'msw';
import type { ArrivalRef } from '@/entities/bus-stop';
import { arrivingArrival, busArrivalsFixture, busStopsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import type { GeoPosition } from '@/shared/lib';
import type * as SharedUi from '@/shared/ui';
import type { MapPoint, MapPopup } from '@/shared/ui';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { BusStopsMap } from './BusStopsMap';

type CapturedMapProps = {
  points?: readonly MapPoint[];
  selectedId?: string;
  onSelectPoint?: (id: string) => void;
  focus?: { lng: number; lat: number };
  fitPoints?: readonly MapPoint[];
  userLocation?: { lng: number; lat: number };
  popup?: MapPopup;
};

const mapRenders = vi.hoisted(() => [] as CapturedMapProps[]);

// jsdom has no WebGL: the map only records the props it receives.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: (props: CapturedMapProps) => {
    mapRenders.push(props);
    return <div data-testid="base-map" />;
  },
}));

const BUS_STOPS_URL = `${env.apiBaseUrl}/v1/bus/stops`;
const SOL: GeoPosition = { lat: 40.41702, lng: -3.70243 };
const USER: GeoPosition = { lat: 40.42, lng: -3.7 };
const UNAVAILABLE = 503;

const nearbyStops: BusStopsResponse = {
  ...busStopsFixture,
  stops: [
    {
      number: '72',
      name: 'Puerta del Sol',
      lat: 40.4168,
      lon: -3.7038,
      lines: ['3'],
      distanceMeters: 12,
    },
    { number: '73', name: 'Sevilla', lat: 40.4172, lon: -3.704, lines: ['5'], distanceMeters: 150 },
    {
      number: '74',
      name: 'Carmen',
      lat: 40.4165,
      lon: -3.7032,
      lines: ['N1'],
      distanceMeters: 320,
    },
  ],
};

const FAR_STOP_NUMBER = '99';
const farStop: BusStopDetailResponse = {
  stop: {
    number: FAR_STOP_NUMBER,
    name: 'Atocha',
    address: null,
    lat: 40.4066,
    lon: -3.6894,
    lines: [],
  },
  updatedAt: busStopsFixture.updatedAt,
  stale: false,
  source: busStopsFixture.source,
};

function respondNearby(body: BusStopsResponse) {
  server.use(http.get(BUS_STOPS_URL, () => HttpResponse.json(body)));
}

function lastMapProps(): CapturedMapProps {
  const props = mapRenders.at(-1);
  if (!props) throw new Error('BaseMap was not rendered');
  return props;
}

function renderMap(
  initialEntry = '/?service=bus',
  onSelect = vi.fn<(number: string) => void>(),
  shownArrival?: ArrivalRef,
) {
  return renderWithRouter(
    <BusStopsMap
      center={SOL}
      mapCenter={SOL}
      userLocation={USER}
      onSelect={onSelect}
      shownArrival={shownArrival}
    />,
    { initialEntries: [initialEntry] },
  );
}

async function waitForPoints(count: number) {
  await waitFor(() => expect(lastMapProps().points).toHaveLength(count));
}

beforeEach(() => {
  mapRenders.length = 0;
  respondNearby(nearbyStops);
});

describe('BusStopsMap', () => {
  it('draws a square bus point for every nearby stop', async () => {
    await renderMap();
    await waitForPoints(3);

    expect(lastMapProps().points).toEqual([
      expect.objectContaining({
        id: '72',
        lng: -3.7038,
        lat: 40.4168,
        shape: 'square',
        icon: 'bus',
      }),
      expect.objectContaining({ id: '73', shape: 'square', icon: 'bus' }),
      expect.objectContaining({ id: '74', shape: 'square', icon: 'bus' }),
    ]);
  });

  it('marks the stop in ?stop as the selected point', async () => {
    await renderMap('/?service=bus&stop=73');
    await waitForPoints(3);

    expect(lastMapProps()).toMatchObject({ selectedId: '73' });
  });

  it('opens the popup on the selected stop, labelled with its number', async () => {
    await renderMap('/?service=bus&stop=73');
    await waitForPoints(3);

    expect(lastMapProps().popup).toMatchObject({
      at: { lng: -3.704, lat: 40.4172 },
      label: 'Parada 73',
    });
  });

  it('opens no popup without a selected stop', async () => {
    await renderMap();
    await waitForPoints(3);

    expect(lastMapProps().popup).toBeUndefined();
  });

  it('closes the popup by removing ?stop', async () => {
    const { router } = await renderMap('/?service=bus&stop=73');
    await waitForPoints(3);

    await act(async () => lastMapProps().popup?.onClose());

    expect(router.state.location.href).toBe('/?service=bus');
  });

  it('centers on the user while no stop is selected', async () => {
    await renderMap();
    await waitForPoints(3);

    expect(lastMapProps()).toMatchObject({ focus: SOL, userLocation: USER });
  });

  it('adds a stop beyond the radius and centers on it', async () => {
    server.use(http.get(`${BUS_STOPS_URL}/${FAR_STOP_NUMBER}`, () => HttpResponse.json(farStop)));

    await renderMap(`/?service=bus&stop=${FAR_STOP_NUMBER}`);
    await waitForPoints(4);

    expect(lastMapProps()).toMatchObject({
      selectedId: FAR_STOP_NUMBER,
      focus: { lng: -3.6894, lat: 40.4066 },
    });
    expect(lastMapProps().points?.at(-1)).toMatchObject({ id: FAR_STOP_NUMBER, icon: 'bus' });
  });

  it('does not ask for the detail of a stop already in the radius', async () => {
    const detailRequests: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname.startsWith('/v1/bus/stops/'))
        detailRequests.push(request.url);
    });

    await renderMap('/?service=bus&stop=73');
    await waitForPoints(3);

    expect(detailRequests).toEqual([]);
  });

  it('writes ?stop and reports the tapped point', async () => {
    const onSelect = vi.fn<(number: string) => void>();
    const { router } = await renderMap('/?service=bus', onSelect);
    await waitForPoints(3);

    await act(async () => lastMapProps().onSelectPoint?.('73'));

    expect(router.state.location.href).toBe('/?service=bus&stop=73');
    expect(onSelect).toHaveBeenCalledWith('73');
  });

  describe('the shown bus', () => {
    const N1_ARRIVAL: ArrivalRef = { line: 'N1', destination: 'Cibeles' };
    const ARRIVALS_URL = `${BUS_STOPS_URL}/72/arrivals`;

    afterEach(() => {
      vi.useRealTimers();
    });

    it('draws the bus as a pill with its line, beside the stop', async () => {
      await renderMap('/?service=bus&stop=72', undefined, N1_ARRIVAL);
      await waitForPoints(4);

      expect(lastMapProps().points?.at(-1)).toEqual(
        expect.objectContaining({
          id: 'bus',
          shape: 'pill',
          icon: 'bus',
          value: 'N1',
          tone: 'info',
          fill: 'tag',
          lng: -3.7037,
          lat: 40.4166,
        }),
      );
    });

    it('fits the map to the stop and the bus together', async () => {
      await renderMap('/?service=bus&stop=72', undefined, N1_ARRIVAL);
      await waitForPoints(4);

      expect(lastMapProps().fitPoints).toEqual([
        expect.objectContaining({ id: '72' }),
        expect.objectContaining({ id: 'bus' }),
      ]);
    });

    it('draws no bus while its arrivals are unavailable', async () => {
      const answered = vi.fn<() => void>();
      server.events.on('response:mocked', ({ request }) => {
        if (request.url.endsWith('/72/arrivals')) answered();
      });
      server.use(
        http.get(ARRIVALS_URL, () =>
          HttpResponse.json({ title: 'Bad Gateway', status: 502 }, { status: 502 }),
        ),
      );

      await renderMap('/?service=bus&stop=72', undefined, N1_ARRIVAL);
      await waitFor(() => expect(answered).toHaveBeenCalled());

      expect(lastMapProps().points).toHaveLength(3);
      expect(lastMapProps().fitPoints).toBeUndefined();
    });

    it('moves the bus with the next arrivals poll, without pressing the button again', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      let bus = { busLat: 40.4166, busLon: -3.7037 };
      server.use(
        http.get(ARRIVALS_URL, () =>
          HttpResponse.json({
            ...busArrivalsFixture,
            arrivals: [{ ...arrivingArrival, ...bus }],
          }),
        ),
      );
      await renderMap('/?service=bus&stop=72', undefined, N1_ARRIVAL);
      await waitForPoints(4);
      expect(lastMapProps().points?.at(-1)).toMatchObject({ lng: -3.7037, lat: 40.4166 });

      bus = { busLat: 40.4201, busLon: -3.7011 };
      await act(() => vi.advanceTimersByTimeAsync(30_000));

      await waitFor(() =>
        expect(lastMapProps().points?.at(-1)).toMatchObject({ lng: -3.7011, lat: 40.4201 }),
      );
    });

    it('does not select a stop when the bus is tapped', async () => {
      const onSelect = vi.fn<(number: string) => void>();
      const { router } = await renderMap('/?service=bus&stop=72', onSelect, N1_ARRIVAL);
      await waitForPoints(4);

      await act(async () => lastMapProps().onSelectPoint?.('bus'));

      expect(onSelect).not.toHaveBeenCalled();
      expect(router.state.location.href).toBe('/?service=bus&stop=72');
    });
  });

  it('draws no points while the nearby stops fail', async () => {
    const answered = vi.fn<() => void>();
    server.events.on('response:mocked', answered);
    server.use(
      http.get(BUS_STOPS_URL, () =>
        HttpResponse.json(
          { title: 'Service Unavailable', status: UNAVAILABLE },
          { status: UNAVAILABLE },
        ),
      ),
    );

    await renderMap();
    await waitFor(() => expect(answered).toHaveBeenCalled());

    expect(lastMapProps().points).toEqual([]);
  });
});
