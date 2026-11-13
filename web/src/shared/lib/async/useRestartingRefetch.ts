import { type QueryKey, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { POLL_INTERVAL_MS } from '@/shared/config';
import { restartWait, retryDelayMs } from './retryPacing';

// retryDelayMs is the wait before the next automatic request, the same one refetchInterval uses,
// so a countdown cannot drift from the real retry.
type PacedQueryResult<TData> = UseQueryResult<TData> & { retryDelayMs: number };

// «Reintentar» asks at once and restarts the wait at 30 s even if that request fails too. A Proxy
// swaps refetch and adds retryDelayMs without reading every field, which would defeat TanStack's
// tracked re-renders.
export function useRestartingRefetch<TData>(
  result: UseQueryResult<TData>,
  queryKey: QueryKey,
): PacedQueryResult<TData> {
  const queryClient = useQueryClient();
  const findQuery = () => queryClient.getQueryCache().find({ queryKey, exact: true });
  const refetch: typeof result.refetch = (options) => {
    const query = findQuery();
    if (query) restartWait(query);
    return result.refetch(options);
  };
  const currentDelayMs = () => {
    const query = findQuery();
    return query ? retryDelayMs(query) : POLL_INTERVAL_MS;
  };
  return new Proxy(result as PacedQueryResult<TData>, {
    get: (target, property, receiver) => {
      if (property === 'refetch') return refetch;
      if (property === 'retryDelayMs') return currentDelayMs();
      return Reflect.get(target, property, receiver);
    },
  });
}
