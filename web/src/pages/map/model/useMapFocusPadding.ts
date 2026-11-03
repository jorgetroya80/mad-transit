import { type SheetSnap, useBottomSheetOverlap } from '@/shared/ui';

// The bottom sheet covers the bottom of the map, so the focused station is centered above it.
export function useMapFocusPadding(snap: SheetSnap) {
  return { bottom: useBottomSheetOverlap(snap) };
}
