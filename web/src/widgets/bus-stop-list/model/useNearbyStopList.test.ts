import { act, renderHook } from '@testing-library/react';
import type * as BusStopEntity from '@/entities/bus-stop';
import { BusRequestError, blockedUntil, useNearbyStops } from '@/entities/bus-stop';
import { NOW_TICK_MS } from '@/shared/config';
import { useNearbyStopList } from './useNearbyStopList';

vi.mock('@/entities/bus-stop', async (importOriginal) => {
  const actual = await importOriginal<typeof BusStopEntity>();
  return {
    ...actual,
    useNearbyStops: vi.fn<typeof actual.useNearbyStops>(),
    blockedUntil: vi.fn<typeof actual.blockedUntil>(actual.blockedUntil),
  };
});

const START = new Date('2026-11-13T10:00:00Z');
const RETRY_AFTER_MS = 60_000;

type NearbyQuery = ReturnType<typeof useNearbyStops>;

function failedNearbyQuery(error: unknown): NearbyQuery {
  return {
    data: undefined,
    isError: true,
    error,
    errorUpdatedAt: START.getTime(),
    isFetching: false,
    refetch: vi.fn<() => void>(),
  } as unknown as NearbyQuery;
}

function unavailableWithRetryAfter(): BusRequestError {
  const response = new Response(null, {
    status: 503,
    headers: { 'Retry-After': String(RETRY_AFTER_MS / 1000) },
  });
  return new BusRequestError({ error: new Error('unavailable'), response });
}

describe('useNearbyStopList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('blocks a retry until Retry-After has passed, then frees it', () => {
    vi.mocked(useNearbyStops).mockReturnValue(failedNearbyQuery(unavailableWithRetryAfter()));
    const { result } = renderHook(() => useNearbyStopList(undefined));

    expect(result.current.isRetryBlocked).toBe(true);
    act(() => vi.advanceTimersByTime(RETRY_AFTER_MS - NOW_TICK_MS));
    expect(result.current.isRetryBlocked).toBe(true);
    act(() => vi.advanceTimersByTime(NOW_TICK_MS));
    expect(result.current.isRetryBlocked).toBe(false);
  });

  it('takes the retry deadline from the bus-stop entity, counted from the failure', () => {
    const error = new Error('server error');
    vi.mocked(useNearbyStops).mockReturnValue(failedNearbyQuery(error));

    renderHook(() => useNearbyStopList(undefined));

    expect(blockedUntil).toHaveBeenCalledWith(error, START.getTime());
  });
});
