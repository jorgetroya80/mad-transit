import type { StationsResponse } from '@jorgetroya80/mad-transit-client';
import { type PlaceholderDataFunction, skipToken, useQuery } from '@tanstack/react-query';
import { retryDelayMs, useRestartingRefetch } from '@/shared/lib';
import type { Need } from '../model/types';
import { fetchAllStations, fetchNearbyStations, fetchStation } from './fetchStations';
import { type Coordinates, stationKeys, toNearParam } from './stationKeys';
import {
  readAllStations,
  readNearbyStations,
  saveAllStations,
  saveNearbyStations,
} from './stationsCache';

// Failures are not retried at once: retryDelayMs paces the next attempt. A missing station
// follows the same pace, so it is asked for again slower and slower.
export function useAllStations() {
  const queryKey = stationKeys.all();
  const result = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await fetchAllStations({ signal });
      saveAllStations(response);
      return response;
    },
    // Read once, when the query is created. The save time makes an old cache stale, so it is
    // asked for again on mount.
    initialData: () => readAllStations()?.response,
    initialDataUpdatedAt: () => readAllStations()?.savedAt,
    retry: 0,
    refetchInterval: retryDelayMs,
  });
  return useRestartingRefetch(result, queryKey);
}

async function fetchAndSaveNearby(
  center: Coordinates,
  need: Need,
  signal: AbortSignal,
): Promise<StationsResponse> {
  const near = toNearParam(center);
  const response = await fetchNearbyStations({ near, need, signal });
  saveNearbyStations(need, near, response);
  return response;
}

// Module-level so TanStack keeps the placeholder between renders instead of reading storage
// again. The previous rows of the same hook win; the saved list only fills an empty start.
type NearbyKey = ReturnType<typeof stationKeys.nearby>;

const nearbyPlaceholders: Record<
  Need,
  PlaceholderDataFunction<StationsResponse, Error, StationsResponse, NearbyKey>
> = {
  bikes: (previous) => previous ?? readNearbyStations('bikes')?.response,
  docks: (previous) => previous ?? readNearbyStations('docks')?.response,
};

// Switching need or center keeps the previous rows on screen until the new ones arrive,
// instead of flashing back to loading. On a fresh start, the last saved list of the need fills
// in, even for another center.
export function useNearbyStations(center: Coordinates | undefined, need: Need) {
  const queryKey = stationKeys.nearby(center, need);
  const result = useQuery({
    queryKey,
    queryFn: center ? ({ signal }) => fetchAndSaveNearby(center, need, signal) : skipToken,
    placeholderData: nearbyPlaceholders[need],
    retry: 0,
    refetchInterval: retryDelayMs,
  });
  return useRestartingRefetch(result, queryKey);
}

export function useStation(number: string | undefined) {
  const queryKey = stationKeys.detail(number);
  const result = useQuery({
    queryKey,
    queryFn: number ? ({ signal }) => fetchStation({ number, signal }) : skipToken,
    retry: 0,
    refetchInterval: retryDelayMs,
  });
  return useRestartingRefetch(result, queryKey);
}
