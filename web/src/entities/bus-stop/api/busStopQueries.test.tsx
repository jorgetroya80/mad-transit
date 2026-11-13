import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http } from 'msw';
import type { ReactNode } from 'react';
import { problemResponse } from '@/shared/api/mocks/handlers';
import { server } from '@/shared/api/mocks/node';
import {
  busArrivalsFixture,
  busStopDetailFixture,
  busStopsFixture,
  emtBadResponseProblem,
  nearbyBusStopsFixture,
  notFoundProblem,
  rateLimitedProblem,
} from '@/shared/api/mocks/fixtures';
import { env, POLL_INTERVAL_MS, RETRY_DELAYS_MS } from '@/shared/config';
import { BusRequestError } from './BusRequestError';
import { useAllStops, useArrivals, useNearbyStops, useStop } from './busStopQueries';
import { busStopKeys } from './busStopKeys';

const STOPS_URL = `${env.apiBaseUrl}/v1/bus/stops`;
const STOP_PATH = `${STOPS_URL}/72`;
const ARRIVALS_PATH = `${STOP_PATH}/arrivals`;
const SOL = { lat: 40.41684, lng: -3.70376 };
// Fake time also advances with the real clock, so a wait is checked with a margin around it.
const MARGIN_MS = 1000;
const [FIRST_RETRY_MS, SECOND_RETRY_MS] = RETRY_DELAYS_MS;
const ONE_HOUR_MS = 60 * 60 * 1000;

// Same retry and background defaults as the app's QueryClient: the queries pace their own retries.
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0, refetchIntervalInBackground: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function recordRequests(): URL[] {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    urls.push(new URL(request.url));
  });
  return urls;
}

// Checks that no request goes out until the wait is over, and that one does right after it.
async function expectNextRequestAfter(urls: URL[], waitMs: number) {
  const before = urls.length;
  await vi.advanceTimersByTimeAsync(waitMs - MARGIN_MS);
  expect(urls).toHaveLength(before);
  await vi.advanceTimersByTimeAsync(MARGIN_MS);
  await vi.waitFor(() => expect(urls).toHaveLength(before + 1));
}

async function settled(result: { current: { fetchStatus: string } }) {
  await vi.waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
}

afterEach(() => {
  server.events.removeAllListeners();
  vi.useRealTimers();
  focusManager.setFocused(undefined);
});

describe('useNearbyStops', () => {
  it('asks for the stops around the center rounded to 4 decimals, within 500 m', async () => {
    const urls = recordRequests();

    const { result } = renderHook(() => useNearbyStops(SOL), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls).toHaveLength(1);
    expect(urls[0]?.searchParams.get('near')).toBe('40.4168,-3.7038');
    expect(urls[0]?.searchParams.get('radius')).toBe('500');
    expect(result.current.data).toEqual(nearbyBusStopsFixture);
  });

  it('waits for a center before asking', async () => {
    const urls = recordRequests();

    const { result } = renderHook(() => useNearbyStops(undefined), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.fetchStatus).toBe('idle');
    expect(urls).toHaveLength(0);
  });

  it('does not poll while the stops answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();

    const { result } = renderHook(() => useNearbyStops(SOL), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    await vi.advanceTimersByTimeAsync(3 * POLL_INTERVAL_MS);
    expect(urls).toHaveLength(1);
  });

  it('retries a 502 after the paced wait, not at once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();
    server.use(http.get(STOPS_URL, () => problemResponse(emtBadResponseProblem(STOPS_URL))));

    const { result } = renderHook(() => useNearbyStops(SOL), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    await expectNextRequestAfter(urls, FIRST_RETRY_MS);
  });
});

describe('useAllStops', () => {
  it('asks for every stop, without a center', async () => {
    const urls = recordRequests();

    const { result } = renderHook(() => useAllStops(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls.map((url) => url.search)).toEqual(['']);
    expect(result.current.data).toEqual(busStopsFixture);
  });
});

describe('cache lifetime', () => {
  it('keeps every stop fresh for 24 h, and the nearby and single stops for 1 h', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const all = renderHook(() => useAllStops(), { wrapper });
    const nearby = renderHook(() => useNearbyStops(SOL), { wrapper });
    const stop = renderHook(() => useStop('72'), { wrapper });
    await waitFor(() => expect(all.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(nearby.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(stop.result.current.isSuccess).toBe(true));

    const staleTimeOf = (queryKey: readonly unknown[]) =>
      queryClient.getQueryCache().find({ queryKey, exact: true })?.observers[0]?.options.staleTime;
    expect(staleTimeOf(busStopKeys.all())).toBe(24 * ONE_HOUR_MS);
    expect(staleTimeOf(busStopKeys.nearby(SOL))).toBe(ONE_HOUR_MS);
    expect(staleTimeOf(busStopKeys.detail('72'))).toBe(ONE_HOUR_MS);
  });
});

describe('useStop', () => {
  it('asks for the stop by its number', async () => {
    const urls = recordRequests();

    const { result } = renderHook(() => useStop('72'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls.map((url) => url.pathname)).toEqual([STOP_PATH]);
    expect(result.current.data).toEqual(busStopDetailFixture);
  });

  it('waits for a number before asking', async () => {
    const urls = recordRequests();

    const { result } = renderHook(() => useStop(undefined), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.fetchStatus).toBe('idle');
    expect(urls).toHaveLength(0);
  });

  it('reports an unknown number with its 404 and does not retry it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();

    const { result } = renderHook(() => useStop('99999'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(BusRequestError);
    expect(result.current.error).toMatchObject({ status: 404 });
    await vi.advanceTimersByTimeAsync(10 * POLL_INTERVAL_MS);
    expect(urls).toHaveLength(1);
  });
});

describe('useArrivals', () => {
  it('asks for the arrivals of the stop by its number', async () => {
    const urls = recordRequests();

    const { result } = renderHook(() => useArrivals('72'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls.map((url) => url.pathname)).toEqual([ARRIVALS_PATH]);
    expect(result.current.data).toEqual(busArrivalsFixture);
  });

  it('reports an unknown stop with its 404 and does not poll it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();

    const { result } = renderHook(() => useArrivals('99999'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 404 });
    await vi.advanceTimersByTimeAsync(10 * POLL_INTERVAL_MS);
    expect(urls).toHaveLength(1);
  });

  it('polls every 30 s while the requests succeed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();

    const { result } = renderHook(() => useArrivals('72'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    await expectNextRequestAfter(urls, POLL_INTERVAL_MS);
    await settled(result);
    await expectNextRequestAfter(urls, POLL_INTERVAL_MS);
  });

  it('does not poll while the tab is hidden', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();

    const { result } = renderHook(() => useArrivals('72'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => focusManager.setFocused(false));
    await vi.advanceTimersByTimeAsync(3 * POLL_INTERVAL_MS);
    expect(urls).toHaveLength(1);
  });

  it.each([400, 404])('does not retry a %i, however many polls pass', async (status) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();
    server.use(
      http.get(`${STOPS_URL}/:number/arrivals`, () =>
        problemResponse({ ...notFoundProblem(ARRIVALS_PATH), status }),
      ),
    );

    const { result } = renderHook(() => useArrivals('72'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status });
    await vi.advanceTimersByTimeAsync(10 * POLL_INTERVAL_MS);
    expect(urls).toHaveLength(1);
  });

  it('retries a 502 on the paced waits: 30 s, then 60 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();
    server.use(
      http.get(`${STOPS_URL}/:number/arrivals`, () =>
        problemResponse(emtBadResponseProblem(ARRIVALS_PATH)),
      ),
    );

    const { result } = renderHook(() => useArrivals('72'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    await expectNextRequestAfter(urls, FIRST_RETRY_MS);
    await settled(result);
    await expectNextRequestAfter(urls, SECOND_RETRY_MS);
  });

  it('does not ask again before Retry-After after a 429, even past the paced wait', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();
    const RETRY_AFTER_S = 120;
    server.use(
      http.get(`${STOPS_URL}/:number/arrivals`, () =>
        problemResponse(rateLimitedProblem(ARRIVALS_PATH), {
          'Retry-After': String(RETRY_AFTER_S),
        }),
      ),
    );

    const { result } = renderHook(() => useArrivals('72'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 429, retryAfterMs: RETRY_AFTER_S * 1000 });
    await expectNextRequestAfter(urls, RETRY_AFTER_S * 1000);
  });

  it('asks at once on refetch and restarts the wait at 30 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const urls = recordRequests();
    server.use(
      http.get(`${STOPS_URL}/:number/arrivals`, () =>
        problemResponse(emtBadResponseProblem(ARRIVALS_PATH)),
      ),
    );

    const { result } = renderHook(() => useArrivals('72'), { wrapper: createWrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    await expectNextRequestAfter(urls, FIRST_RETRY_MS);
    await settled(result);
    await expectNextRequestAfter(urls, SECOND_RETRY_MS);
    await settled(result);

    await act(async () => {
      await result.current.refetch();
    });
    expect(urls).toHaveLength(4);
    await expectNextRequestAfter(urls, FIRST_RETRY_MS);
  });
});
