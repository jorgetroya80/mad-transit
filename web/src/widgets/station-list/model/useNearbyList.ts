import {
  type Coordinates,
  type DataStatus,
  type Need,
  readNearbyStations,
  type Station,
  useDataStatus,
  useNearbyStations,
} from '@/entities/station';

export type NearbyList = {
  status: DataStatus;
  // Undefined without data, which is not the same as an empty list within the radius.
  stations: readonly Station[] | undefined;
  updatedAt: Date | undefined;
  nextRetryAt: Date | undefined;
  isRetrying: boolean;
  // Returns the refetch promise, so «Reintentar» can show the request as busy.
  retry: () => unknown;
};

// Without a center (location pending) the query stays idle, which reads as loading unless a
// saved list fills in. TanStack drops that saved list (placeholder data) once the request
// fails, so it is read again here: the list stays on screen, unconfirmed, instead of an error.
export function useNearbyList(center: Coordinates | undefined, need: Need): NearbyList {
  const query = useNearbyStations(center, need);
  const { isError } = query;
  const data = query.data ?? (isError ? readNearbyStations(need)?.response : undefined);
  const { status, updatedAt, nextRetryAt, isRetrying, retry } = useDataStatus({
    data,
    isError,
    dataUpdatedAt: query.dataUpdatedAt,
    errorUpdatedAt: query.errorUpdatedAt,
    isFetching: query.isFetching,
    retryDelayMs: query.retryDelayMs,
    refetch: query.refetch,
  });
  return { status, stations: data?.stations, updatedAt, nextRetryAt, isRetrying, retry };
}
