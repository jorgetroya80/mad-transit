import { onlineManager } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { NOW_TICK_MS, POLL_INTERVAL_MS, RETRY_DELAYS_MS, STALE_AFTER_MS } from '@/shared/config';
import { useDataStatus } from './useDataStatus';

const START = new Date('2026-10-31T10:00:00Z');

type Query = Parameters<typeof useDataStatus>[0];

function query(overrides: Partial<Query> = {}): Query {
  return {
    data: { updatedAt: START.toISOString(), stale: false },
    isError: false,
    dataUpdatedAt: START.getTime(),
    errorUpdatedAt: 0,
    isFetching: false,
    retryDelayMs: POLL_INTERVAL_MS,
    refetch: vi.fn<() => void>(),
    ...overrides,
  };
}

describe('useDataStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => {
    vi.useRealTimers();
    onlineManager.setOnline(true);
  });

  it('reports fresh data as ok with the API date', () => {
    const { result } = renderHook(() => useDataStatus(query()));

    expect(result.current.status).toBe('ok');
    expect(result.current.updatedAt).toEqual(START);
  });

  it('turns stale once the data is over 5 min old without new data', () => {
    const { result } = renderHook(() => useDataStatus(query()));

    // The clock ticks every NOW_TICK_MS: the first tick past the limit flips the status.
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS));
    expect(result.current.status).toBe('ok');

    act(() => vi.advanceTimersByTime(NOW_TICK_MS));
    expect(result.current.status).toBe('stale');
  });

  it('reports stale when the API marks the data stale', () => {
    const { result } = renderHook(() =>
      useDataStatus(query({ data: { updatedAt: START.toISOString(), stale: true } })),
    );

    expect(result.current.status).toBe('stale');
  });

  it('reports stale when a refresh fails with data', () => {
    const { result } = renderHook(() => useDataStatus(query({ isError: true })));

    expect(result.current.status).toBe('stale');
  });

  it.each([
    { isError: false, status: 'loading' },
    { isError: true, status: 'error' },
  ])('reports $status without data when isError is $isError', ({ isError, status }) => {
    const { result } = renderHook(() =>
      useDataStatus(query({ data: undefined, isError, dataUpdatedAt: 0 })),
    );

    expect(result.current.status).toBe(status);
    expect(result.current.updatedAt).toBeUndefined();
  });

  it('reports offline when the browser loses the connection', () => {
    const { result } = renderHook(() => useDataStatus(query()));

    act(() => onlineManager.setOnline(false));

    expect(result.current.status).toBe('offline');
  });

  it('falls back to the response time when the API date is unreadable', () => {
    const received = new Date(START.getTime() - 1000);
    const { result } = renderHook(() =>
      useDataStatus(
        query({ data: { updatedAt: 'nope', stale: false }, dataUpdatedAt: received.getTime() }),
      ),
    );

    expect(result.current.updatedAt).toEqual(received);
  });

  it('leaves the date unknown for placeholder data without a readable API date', () => {
    const { result } = renderHook(() =>
      useDataStatus(query({ data: { updatedAt: 'nope', stale: false }, dataUpdatedAt: 0 })),
    );

    expect(result.current.updatedAt).toBeUndefined();
  });

  it('retries by refetching', () => {
    const refetch = vi.fn<() => void>();
    const { result } = renderHook(() => useDataStatus(query({ refetch })));

    result.current.retry();

    expect(refetch).toHaveBeenCalledOnce();
  });

  it('hands back the refetch promise, so the caller can wait for it', () => {
    const pending = Promise.resolve();
    const { result } = renderHook(() => useDataStatus(query({ refetch: () => pending })));

    expect(result.current.retry()).toBe(pending);
  });

  it.each(RETRY_DELAYS_MS.map((retryDelayMs, index) => ({ failures: index + 1, retryDelayMs })))(
    'retries $retryDelayMs ms after the last failure, after $failures failures',
    ({ retryDelayMs }) => {
      const failedAt = START.getTime() - 1000;
      const { result } = renderHook(() =>
        useDataStatus(query({ isError: true, errorUpdatedAt: failedAt, retryDelayMs })),
      );

      expect(result.current.nextRetryAt).toEqual(new Date(failedAt + retryDelayMs));
    },
  );

  it('has no retry time once the last request succeeded', () => {
    const { result } = renderHook(() =>
      useDataStatus(query({ errorUpdatedAt: START.getTime() - 60_000 })),
    );

    expect(result.current.nextRetryAt).toBeUndefined();
  });

  it('keeps the failure while it asks again without data, though TanStack is pending again', () => {
    const failedAt = START.getTime() - 1000;
    const { result } = renderHook(() =>
      useDataStatus(
        query({ data: undefined, dataUpdatedAt: 0, errorUpdatedAt: failedAt, isFetching: true }),
      ),
    );

    expect(result.current.status).toBe('error');
    expect(result.current.isRetrying).toBe(true);
  });

  it.each([
    { case: 'after a failure', isError: true, isFetching: true, isRetrying: true },
    { case: 'between retries', isError: true, isFetching: false, isRetrying: false },
    { case: 'after a success', isError: false, isFetching: true, isRetrying: false },
  ])('is retrying $isRetrying while asking $case', ({ isError, isFetching, isRetrying }) => {
    const errorUpdatedAt = isError ? START.getTime() : 0;
    const { result } = renderHook(() =>
      useDataStatus(query({ isError, isFetching, errorUpdatedAt })),
    );

    expect(result.current.isRetrying).toBe(isRetrying);
  });
});
