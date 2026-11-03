import { act, renderHook } from '@testing-library/react';
import type { SheetSnap } from './sheetSize';
import { useBottomSheetOverlap } from './useBottomSheetOverlap';

describe('useBottomSheetOverlap', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The 112 px peek strip is in the page flow, so the content above already ends over it.
  it.each([
    ['peek', 0],
    ['half', 430 - 112],
    ['full', 700 - 112],
  ] as const)('is the %s height minus the peek strip on a tall viewport', (snap, overlap) => {
    vi.stubGlobal('innerHeight', 900);

    const { result } = renderHook(() => useBottomSheetOverlap(snap));

    expect(result.current).toBe(overlap);
  });

  // 667 px viewport: full is capped at 667 - 144 = 523 px.
  it('caps full at the viewport height minus the 144 px top margin', () => {
    vi.stubGlobal('innerHeight', 667);

    const { result } = renderHook(() => useBottomSheetOverlap('full'));

    expect(result.current).toBe(523 - 112);
  });

  // 500 px viewport: full is 356 px, so half cannot keep its 430 px.
  it('never lets half cover more than full', () => {
    vi.stubGlobal('innerHeight', 500);

    const half = renderHook(() => useBottomSheetOverlap('half')).result.current;
    const full = renderHook(() => useBottomSheetOverlap('full')).result.current;

    expect(half).toBe(356 - 112);
    expect(half).toBe(full);
  });

  it('follows the viewport height and the snap', () => {
    vi.stubGlobal('innerHeight', 667);
    const { result, rerender } = renderHook(({ snap }) => useBottomSheetOverlap(snap), {
      initialProps: { snap: 'full' as SheetSnap },
    });

    act(() => {
      vi.stubGlobal('innerHeight', 900);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(700 - 112);

    rerender({ snap: 'peek' });
    expect(result.current).toBe(0);
  });
});
