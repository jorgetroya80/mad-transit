import { useBottomSheetOverlap } from '@/shared/ui';

// The expanded bottom sheet covers the bottom of the map, so the focused station is centered
// above it.
export function useMapFocusPadding(panelExpanded: boolean) {
  const sheetOverlap = useBottomSheetOverlap();
  return { bottom: panelExpanded ? sheetOverlap : 0 };
}
