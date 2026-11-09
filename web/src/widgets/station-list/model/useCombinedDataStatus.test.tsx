import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import type { StationsResponse } from '@jorgetroya80/mad-transit-client';
import { nearbyStationsFixture, stationsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import { useCombinedDataStatus } from './useCombinedDataStatus';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const SOL = { lat: 40.41702, lng: -3.70243 };
// The fixtures' data is 5 min old here, still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');
const EARLIER = '2026-10-13T09:45:00Z';
const LATER = '2026-10-13T10:05:00Z';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function respond(all: StationsResponse, nearby: StationsResponse) {
  server.use(
    http.get(STATIONS_URL, ({ request }) =>
      HttpResponse.json(new URL(request.url).searchParams.has('near') ? nearby : all),
    ),
  );
}

function renderCombined() {
  return renderHook(() => useCombinedDataStatus(SOL, 'bikes'), { wrapper: createWrapper() });
}

describe('useCombinedDataStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    server.events.removeAllListeners();
    onlineManager.setOnline(true);
  });

  it('is ok when both lists are', async () => {
    const { result } = renderCombined();

    await waitFor(() => expect(result.current.status).toBe('ok'));
  });

  it.each([
    {
      only: 'the full list',
      all: { ...stationsFixture, updatedAt: EARLIER, stale: true },
      nearby: nearbyStationsFixture,
    },
    {
      only: 'the nearby list',
      all: stationsFixture,
      nearby: { ...nearbyStationsFixture, updatedAt: EARLIER, stale: true },
    },
  ])('is stale with only $only stale, dated by the older data (SC3)', async ({ all, nearby }) => {
    respond(all, nearby);

    const { result } = renderCombined();

    await waitFor(() => expect(result.current.status).toBe('stale'));
    expect(result.current.updatedAt).toEqual(new Date(EARLIER));
  });

  it('takes the older time when both are stale', async () => {
    respond(
      { ...stationsFixture, updatedAt: LATER, stale: true },
      { ...nearbyStationsFixture, updatedAt: EARLIER, stale: true },
    );

    const { result } = renderCombined();

    await waitFor(() => expect(result.current.updatedAt).toEqual(new Date(EARLIER)));
  });

  it('is offline, not stale, once the connection drops', async () => {
    respond({ ...stationsFixture, stale: true }, nearbyStationsFixture);
    const { result } = renderCombined();
    await waitFor(() => expect(result.current.status).toBe('stale'));

    act(() => onlineManager.setOnline(false));

    expect(result.current.status).toBe('offline');
  });

  it('asks for both lists again, and settles once both have answered', async () => {
    const urls: URL[] = [];
    server.events.on('request:start', ({ request }) => urls.push(new URL(request.url)));
    const { result } = renderCombined();
    await waitFor(() => expect(result.current.status).toBe('ok'));
    urls.length = 0;

    await act(async () => {
      await result.current.retry();
    });

    expect(urls.map((url) => url.searchParams.has('near')).sort()).toEqual([false, true]);
  });
});
