import { type QueryState, skipToken, useQuery } from '@tanstack/react-query';
import { POLL_INTERVAL_MS } from '@/shared/config';
import { type GeoPosition, retryDelayMs, useRestartingRefetch } from '@/shared/lib';
import { BusRequestError } from './BusRequestError';
import { busStopKeys, toNearParam } from './busStopKeys';
import {
  fetchAllBusStops,
  fetchBusArrivals,
  fetchBusStop,
  fetchNearbyBusStops,
} from './fetchBusStops';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const TOO_MANY_REQUESTS = 429;
const CLIENT_ERROR_MIN = 400;
const SERVER_ERROR_MIN = 500;

type PollQuery = { state: Pick<QueryState, 'status' | 'error' | 'errorUpdateCount'> };

// The wait before the next automatic request: `idle` after a success (false: none), the retry pace
// after a failure. A 4xx never retries; a 429 or a failure with Retry-After waits for it too.
function nextRequestMs(query: PollQuery, idle: number | false): number | false {
  const paced = retryDelayMs(query); // Also after a success: it restarts the wait from there.
  const { status, error } = query.state;
  if (status !== 'error') return idle;
  if (!(error instanceof BusRequestError)) return paced;
  const { status: httpStatus, retryAfterMs } = error;
  const isClientError =
    httpStatus !== undefined && httpStatus >= CLIENT_ERROR_MIN && httpStatus < SERVER_ERROR_MIN;
  if (isClientError && httpStatus !== TOO_MANY_REQUESTS) return false;
  return Math.max(paced, retryAfterMs ?? 0);
}

// Stops and their lines change rarely: no polling, only the retry pace after a failure.
const stopsOptions = {
  staleTime: ONE_HOUR_MS,
  retry: 0,
  refetchInterval: (query: PollQuery) => nextRequestMs(query, false),
};

// The whole city's list changes even less often than one area's, so it is kept longer.
const allStopsOptions = { ...stopsOptions, staleTime: ONE_DAY_MS };

export function useNearbyStops(center: GeoPosition | undefined) {
  const queryKey = busStopKeys.nearby(center);
  const result = useQuery({
    queryKey,
    queryFn: center
      ? ({ signal }) => fetchNearbyBusStops({ near: toNearParam(center), signal })
      : skipToken,
    ...stopsOptions,
  });
  return useRestartingRefetch(result, queryKey);
}

export function useAllStops() {
  const queryKey = busStopKeys.all();
  const result = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchAllBusStops({ signal }),
    ...allStopsOptions,
  });
  return useRestartingRefetch(result, queryKey);
}

export function useStop(number: string | undefined) {
  const queryKey = busStopKeys.detail(number);
  const result = useQuery({
    queryKey,
    queryFn: number ? ({ signal }) => fetchBusStop({ number, signal }) : skipToken,
    ...stopsOptions,
  });
  return useRestartingRefetch(result, queryKey);
}

// Arrivals change every minute: polled every 30 s, but never while the tab is hidden.
export function useArrivals(number: string | undefined) {
  const queryKey = busStopKeys.arrivals(number);
  const result = useQuery({
    queryKey,
    queryFn: number ? ({ signal }) => fetchBusArrivals({ number, signal }) : skipToken,
    retry: 0,
    refetchInterval: (query) => nextRequestMs(query, POLL_INTERVAL_MS),
    refetchIntervalInBackground: false,
  });
  return useRestartingRefetch(result, queryKey);
}
