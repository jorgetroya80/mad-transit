import { act, renderHook } from '@testing-library/react';
import { useCountdown } from './useCountdown';

const START = new Date('2026-11-09T10:00:00Z');
const IN_30_SECONDS = new Date('2026-11-09T10:00:30Z');

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => vi.useRealTimers());

  it('gives the whole seconds left', () => {
    const { result } = renderHook(() => useCountdown(IN_30_SECONDS));

    expect(result.current).toBe(30);
  });

  it('counts down every second', () => {
    const { result } = renderHook(() => useCountdown(IN_30_SECONDS));

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(29);

    act(() => vi.advanceTimersByTime(28_000));
    expect(result.current).toBe(1);
  });

  it('rounds a part of a second up, so it reaches 0 only when the time is up', () => {
    const { result } = renderHook(() => useCountdown(new Date(START.getTime() + 29_500)));

    expect(result.current).toBe(30);
  });

  it('stays at 0 once the time is up', () => {
    const { result } = renderHook(() => useCountdown(IN_30_SECONDS));

    act(() => vi.advanceTimersByTime(45_000));

    expect(result.current).toBe(0);
  });
});
