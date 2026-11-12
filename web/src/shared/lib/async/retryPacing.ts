import type { QueryState } from '@tanstack/react-query';
import { POLL_INTERVAL_MS, RETRY_DELAYS_MS } from '@/shared/config';

export type PacedQuery = { state: Pick<QueryState, 'status' | 'errorUpdateCount'> };

// TanStack Query has no counter of consecutive failures that survives a refetch: fetchFailureCount
// starts again at every fetch and errorUpdateCount never resets. So this keeps the
// errorUpdateCount at which the wait last restarted (a success or a manual retry) per query.
const waitStart = new WeakMap<PacedQuery, number>();

export function restartWait(query: PacedQuery): void {
  waitStart.set(query, query.state.errorUpdateCount);
}

function consecutiveFailures(query: PacedQuery): number {
  const { status, errorUpdateCount } = query.state;
  if (status === 'success') restartWait(query);
  return errorUpdateCount - (waitStart.get(query) ?? 0);
}

// Every 30 s while the requests succeed; after a failure, 30, 60 and then 120 s until one succeeds.
// The interval restarts on every query update, so each wait counts from the last answer.
export function retryDelayMs(query: PacedQuery): number {
  const failures = consecutiveFailures(query);
  if (failures === 0) return POLL_INTERVAL_MS;
  return RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length) - 1] ?? POLL_INTERVAL_MS;
}
