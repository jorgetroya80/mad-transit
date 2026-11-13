import { useNow } from '@/shared/lib';
import { BusRequestError, blockedUntil } from '../api/BusRequestError';
import { useArrivals } from '../api/busStopQueries';
import type { Arrival } from './types';

export type FreshArrivals = {
  // Undefined while loading, or once a failed refresh leaves the last ones too old to show.
  arrivals: readonly Arrival[] | undefined;
  isUnavailable: boolean;
  // The EMT's daily quota is spent: a 503 with Retry-After, which has no retry button.
  isQuotaExhausted: boolean;
  // A 429 with Retry-After: «Reintentar» waits for it.
  isRetryBlocked: boolean;
  // The API says the arrivals are old, or a refresh failed and they are still shown.
  isStale: boolean;
  updatedAt: Date | undefined;
  retry: () => Promise<unknown>;
};

const MAX_AGE_AFTER_FAILURE_MS = 2 * 60 * 1000;
const SERVICE_UNAVAILABLE = 503;
// Ticks each second so the two-minute limit lands on time, not up to 30 s late.
const CLOCK_TICK_MS = 1000;

function isQuotaExhausted(error: unknown): boolean {
  return (
    error instanceof BusRequestError &&
    error.status === SERVICE_UNAVAILABLE &&
    error.retryAfterMs !== undefined
  );
}

// Polling is the query's own: every 30 s, never in a hidden tab, and only while the stop is open.
export function useFreshArrivals(number: string): FreshArrivals {
  const query = useArrivals(number);
  const { data, isError, error, errorUpdatedAt } = query;
  const now = useNow(CLOCK_TICK_MS);
  const updatedAt = data && new Date(data.updatedAt);
  const isExpired =
    isError &&
    (updatedAt === undefined || now.getTime() - updatedAt.getTime() > MAX_AGE_AFTER_FAILURE_MS);

  return {
    arrivals: isExpired ? undefined : data?.arrivals,
    isUnavailable: isExpired,
    isQuotaExhausted: isQuotaExhausted(error),
    isRetryBlocked: now.getTime() < blockedUntil(error, errorUpdatedAt),
    isStale: data !== undefined && (data.stale || isError),
    updatedAt,
    retry: () => query.refetch(),
  };
}
