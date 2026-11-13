import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { BusStopsResponse } from '@jorgetroya80/mad-transit-client';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import type { ArrivalRef } from '@/entities/bus-stop';
import { busArrivalsFixture, busStopsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import type { GeoPosition } from '@/shared/lib';
import { useMapPoints } from './useMapPoints';

const BUS_STOPS_URL = `${env.apiBaseUrl}/v1/bus/stops`;
const ARRIVALS_URL = `${BUS_STOPS_URL}/72/arrivals`;
const SOL: GeoPosition = { lat: 40.41702, lng: -3.70243 };
const N1_ARRIVAL: ArrivalRef = { line: 'N1', destination: 'Cibeles' };
const TWO_MINUTES_MS = 2 * 60 * 1000;
const POLL_MS = 30_000;

const nearbyStops: BusStopsResponse = {
  ...busStopsFixture,
  stops: [
    {
      number: '72',
      name: 'Puerta del Sol',
      lat: 40.4168,
      lon: -3.7038,
      lines: ['N1'],
      distanceMeters: 12,
    },
  ],
};

// The arrivals are stamped with the clock at the time of the answer, so the age is measurable.
function answerArrivals() {
  server.use(
    http.get(ARRIVALS_URL, () =>
      HttpResponse.json({ ...busArrivalsFixture, updatedAt: new Date().toISOString() }),
    ),
  );
}

function failArrivals() {
  server.use(
    http.get(ARRIVALS_URL, () =>
      HttpResponse.json({ title: 'Bad Gateway', status: 502 }, { status: 502 }),
    ),
  );
}

function renderPoints() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useMapPoints(SOL, '72', N1_ARRIVAL), { wrapper });
}

describe('useMapPoints', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(http.get(BUS_STOPS_URL, () => HttpResponse.json(nearbyStops)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the same points array while the clock ticks and nothing changed', async () => {
    answerArrivals();
    const { result } = renderPoints();
    await waitFor(() => expect(result.current.points).toHaveLength(2));
    const before = result.current.points;

    await act(() => vi.advanceTimersByTimeAsync(5_000));

    expect(result.current.points).toBe(before);
  });

  it('drops the bus point, with a new array, once its arrivals are two minutes old', async () => {
    answerArrivals();
    const { result } = renderPoints();
    await waitFor(() => expect(result.current.points).toHaveLength(2));
    const before = result.current.points;

    failArrivals();
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    await act(() => vi.advanceTimersByTimeAsync(TWO_MINUTES_MS - POLL_MS - 2_000));
    expect(result.current.points).toHaveLength(2);

    await act(() => vi.advanceTimersByTimeAsync(4_000));

    expect(result.current.points.map((point) => point.id)).toEqual(['72']);
    expect(result.current.points).not.toBe(before);
  });
});
