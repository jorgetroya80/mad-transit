import { act, renderHook } from '@testing-library/react';
import { useShownArrival } from './useShownArrival';

const N1 = { line: 'N1', destination: 'Cibeles' };
const LINE_3 = { line: '3', destination: 'Legazpi' };

describe('useShownArrival', () => {
  it('shows an arrival, and takes it off when it is pressed again', () => {
    const { result } = renderHook(() => useShownArrival('72'));

    act(() => result.current.toggleOnMap(N1));
    expect(result.current.shownArrival).toEqual(N1);

    act(() => result.current.toggleOnMap(N1));
    expect(result.current.shownArrival).toBeUndefined();
  });

  it('shows one bus at a time: another arrival replaces the shown one', () => {
    const { result } = renderHook(() => useShownArrival('72'));

    act(() => result.current.toggleOnMap(N1));
    act(() => result.current.toggleOnMap(LINE_3));

    expect(result.current.shownArrival).toEqual(LINE_3);
  });

  it('takes the bus off when its stop closes, and does not bring it back with the same stop', () => {
    const { result, rerender } = renderHook(({ number }) => useShownArrival(number), {
      initialProps: { number: '72' as string | undefined },
    });
    act(() => result.current.toggleOnMap(N1));

    rerender({ number: undefined });
    expect(result.current.shownArrival).toBeUndefined();

    rerender({ number: '72' });
    expect(result.current.shownArrival).toBeUndefined();
  });

  it('takes the bus off when another stop opens', () => {
    const { result, rerender } = renderHook(({ number }) => useShownArrival(number), {
      initialProps: { number: '72' as string | undefined },
    });
    act(() => result.current.toggleOnMap(N1));

    rerender({ number: '73' });

    expect(result.current.shownArrival).toBeUndefined();
  });
});
