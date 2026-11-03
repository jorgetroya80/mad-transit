import { act, renderHook } from '@testing-library/react';
import type { SheetSnap } from './sheetSize';
import { useBottomSheetOverlap } from './useBottomSheetOverlap';

describe('useBottomSheetOverlap', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The 56 px hidden strip is in the page flow, so the content above already ends over it.
  it.each([
    ['hidden', 0],
    ['half', 430 - 56],
  ] as const)('is the %s height minus the hidden strip on a tall viewport', (snap, overlap) => {
    vi.stubGlobal('innerHeight', 900);

    const { result } = renderHook(() => useBottomSheetOverlap(snap));

    expect(result.current).toBe(overlap);
  });

  // 500 px viewport: half is capped at 500 - 166 = 334 px.
  it('caps half at the viewport height minus the 166 px top margin', () => {
    vi.stubGlobal('innerHeight', 500);

    const { result } = renderHook(() => useBottomSheetOverlap('half'));

    expect(result.current).toBe(334 - 56);
  });

  it('follows the viewport height and the snap', () => {
    vi.stubGlobal('innerHeight', 500);
    const { result, rerender } = renderHook(({ snap }) => useBottomSheetOverlap(snap), {
      initialProps: { snap: 'half' as SheetSnap },
    });

    act(() => {
      vi.stubGlobal('innerHeight', 900);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(430 - 56);

    rerender({ snap: 'hidden' });
    expect(result.current).toBe(0);
  });
});
