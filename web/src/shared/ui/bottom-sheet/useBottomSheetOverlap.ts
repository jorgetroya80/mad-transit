import { useViewportHeight } from '@/shared/lib';
import { FULL_SHEET_TOP_MARGIN_PX, SHEET_HEIGHT_PX, type SheetSnap } from './sheetSize';

// Height of the content above the sheet that each snap covers: the peek strip is in the page
// flow, so that content already ends above it. innerHeight follows the viewport the same way
// dvh does, so this matches the capped height of `sheetHeight`.
export function useBottomSheetOverlap(snap: SheetSnap): number {
  const viewportHeight = useViewportHeight();
  const sheetHeight = Math.min(SHEET_HEIGHT_PX[snap], viewportHeight - FULL_SHEET_TOP_MARGIN_PX);
  return Math.max(0, sheetHeight - SHEET_HEIGHT_PX.peek);
}
