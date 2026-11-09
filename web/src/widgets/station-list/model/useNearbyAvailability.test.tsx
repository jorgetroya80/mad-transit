import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import type { StationsResponse } from '@jorgetroya80/mad-transit-client';
import { nearbyStationsFixture, stationsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import { useNearbyAvailability } from './useNearbyAvailability';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const SOL = { lat: 40.41702, lng: -3.70243 };

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function nearbyJson(body: StationsResponse) {
  server.use(
    http.get(STATIONS_URL, ({ request }) =>
      HttpResponse.json(new URL(request.url).searchParams.has('near') ? body : stationsFixture),
    ),
  );
}

describe('useNearbyAvailability', () => {
  afterEach(() => {
    localStorage.clear();
    onlineManager.setOnline(true);
  });

  // Fixtures: 1a has 12 bikes, 1b has 2, and station 2 is out of service.
  it('counts the nearby stations in service with at least one bike', async () => {
    const { result } = renderHook(() => useNearbyAvailability(SOL, 'bikes'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.count).toBe(2));
    expect(result.current.updatedAt).toEqual(new Date(nearbyStationsFixture.updatedAt));
  });

  // 1a has no free dock, and station 2 has some but is out of service.
  it('counts the nearby stations in service with at least one free dock in docks mode', async () => {
    nearbyJson({
      ...nearbyStationsFixture,
      stations: nearbyStationsFixture.stations.map((station) => ({
        ...station,
        freeDocks: station.number === '1a' ? 0 : 5,
      })),
    });

    const { result } = renderHook(() => useNearbyAvailability(SOL, 'docks'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.count).toBe(1));
  });

  it('has no count while there is no data', () => {
    const { result } = renderHook(() => useNearbyAvailability(undefined, 'bikes'), {
      wrapper: createWrapper(),
    });

    expect(result.current).toEqual({ count: undefined, updatedAt: undefined, isSaved: false });
  });

  it('tells when the list is the saved one, offline with data', async () => {
    const { result } = renderHook(() => useNearbyAvailability(SOL, 'bikes'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.count).toBe(2));
    expect(result.current.isSaved).toBe(false);

    act(() => onlineManager.setOnline(false));

    expect(result.current.isSaved).toBe(true);
    act(() => onlineManager.setOnline(true));
    expect(result.current.isSaved).toBe(false);
  });

  it('is not the saved list offline without data', () => {
    onlineManager.setOnline(false);
    const { result } = renderHook(() => useNearbyAvailability(SOL, 'bikes'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSaved).toBe(false);
  });
});
