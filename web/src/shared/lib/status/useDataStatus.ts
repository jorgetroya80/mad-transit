import { NOW_TICK_MS } from '@/shared/config';
import { useOnline } from '../network/useOnline';
import { parseUpdatedAt } from '../time/parseUpdatedAt';
import { useNow } from '../time/useNow';
import { type DataStatus, dataStatus } from './dataStatus';

// The slice of a query this needs. Every response carries the API's `updatedAt` and its `stale`
// flag; every query, the wait before its next request.
type StatusQuery = {
  data: { updatedAt: string; stale: boolean } | undefined;
  isError: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  isFetching: boolean;
  retryDelayMs: number;
  refetch: () => unknown;
};

export type DataStatusResult = {
  status: DataStatus;
  updatedAt: Date | undefined;
  // When the next automatic request goes out after a failure; undefined if the last one succeeded.
  nextRetryAt: Date | undefined;
  // A request is in flight after a failure.
  isRetrying: boolean;
  // Returns the refetch promise, so a caller can show the request as busy until it settles.
  retry: () => unknown;
};

// Placeholder data has no arrival time (0): its age is unknown rather than 1970.
function receivedAt(dataUpdatedAt: number): Date | undefined {
  return dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : undefined;
}

// Without a readable API date, the data is as old as the response that brought it. The clock
// ticks so data turns stale after 5 min even when nothing else re-renders.
export function useDataStatus({
  data,
  isError,
  dataUpdatedAt,
  errorUpdatedAt,
  isFetching,
  retryDelayMs,
  refetch,
}: StatusQuery): DataStatusResult {
  // Asking again without data resets TanStack's status to pending; the failure still stands
  // until an answer arrives.
  const failed = isError || errorUpdatedAt > dataUpdatedAt;
  const online = useOnline();
  const now = useNow(NOW_TICK_MS);
  const updatedAt = data
    ? (parseUpdatedAt(data.updatedAt) ?? receivedAt(dataUpdatedAt))
    : undefined;

  return {
    status: dataStatus({
      hasData: data !== undefined,
      failed,
      apiStale: data?.stale ?? false,
      updatedAt,
      now: now.getTime(),
      online,
    }),
    updatedAt,
    nextRetryAt: failed ? new Date(errorUpdatedAt + retryDelayMs) : undefined,
    isRetrying: failed && isFetching,
    retry: () => refetch(),
  };
}
