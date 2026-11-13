import { BusRequestError, type BusStop, useNearbyStops } from '@/entities/bus-stop';
import { NOW_TICK_MS } from '@/shared/config';
import { type GeoPosition, useNow } from '@/shared/lib';

export type NearbyStopList = {
  // Undefined without data: the list is loading or has failed.
  stops: readonly BusStop[] | undefined;
  isError: boolean;
  // The API says the stops are old, or the last refresh failed: they stay, unconfirmed.
  isStale: boolean;
  updatedAt: Date | undefined;
  // A 503 or 429 with Retry-After: «Reintentar» waits for it.
  isRetryBlocked: boolean;
  isRetrying: boolean;
  retry: () => Promise<unknown>;
};

export function useNearbyStopList(center: GeoPosition | undefined): NearbyStopList {
  const query = useNearbyStops(center);
  const { data, isError, error, errorUpdatedAt, isFetching } = query;
  const now = useNow(NOW_TICK_MS);
  const retryAfterMs = error instanceof BusRequestError ? error.retryAfterMs : undefined;
  const blockedUntil = isError && retryAfterMs !== undefined ? errorUpdatedAt + retryAfterMs : 0;

  return {
    stops: data?.stops,
    isError,
    isStale: data !== undefined && (data.stale || isError),
    updatedAt: data && new Date(data.updatedAt),
    isRetryBlocked: now.getTime() < blockedUntil,
    isRetrying: isError && isFetching,
    retry: () => query.refetch(),
  };
}
