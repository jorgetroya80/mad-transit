import { BusRequestError, type BusStopInfo, useNearbyStops, useStop } from '@/entities/bus-stop';
import { NOW_TICK_MS } from '@/shared/config';
import { type GeoPosition, useNow } from '@/shared/lib';

export type StopDetail = {
  isNotFound: boolean;
  // Undefined without data: the stop is loading or has failed.
  stop: BusStopInfo | undefined;
  isError: boolean;
  // The API says the stop is old, or the last refresh failed: it stays, unconfirmed.
  isStale: boolean;
  updatedAt: Date | undefined;
  // Only for a stop in the nearby list, so beyond the radius there is none.
  distanceMeters: number | undefined;
  // A 503 or 429 with Retry-After: «Reintentar» waits for it.
  isRetryBlocked: boolean;
  retry: () => Promise<unknown>;
};

const NOT_FOUND = 404;

// Retry-After counts from the failure; without a failure with it, nothing blocks.
function blockedUntil(error: unknown, failedAt: number): number {
  if (!(error instanceof BusRequestError) || error.retryAfterMs === undefined) return 0;
  return failedAt + error.retryAfterMs;
}

// The lines and the address come only with the stop, so the detail always asks for it. The
// distance comes from the nearby list, the same query the list uses, so it adds no request.
export function useStopDetail(number: string, center: GeoPosition | undefined): StopDetail {
  const query = useStop(number);
  const { data, isError, error, errorUpdatedAt } = query;
  const nearby = useNearbyStops(center);
  const now = useNow(NOW_TICK_MS);

  return {
    isNotFound: error instanceof BusRequestError && error.status === NOT_FOUND,
    stop: data?.stop,
    isError,
    isStale: data !== undefined && (data.stale || isError),
    updatedAt: data && new Date(data.updatedAt),
    distanceMeters: nearby.data?.stops.find((stop) => stop.number === number)?.distanceMeters,
    isRetryBlocked: now.getTime() < blockedUntil(error, errorUpdatedAt),
    retry: () => query.refetch(),
  };
}
