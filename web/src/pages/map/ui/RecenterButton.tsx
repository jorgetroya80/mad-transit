import { LocationIcon, type SheetSnap, useBottomSheetOverlap } from '@/shared/ui';

type RecenterButtonProps = {
  snap: SheetSnap;
  isRecentering: boolean;
  onRecenter: () => void;
};

const SHEET_GAP_PX = 16;

// Rides 16 px above the sheet with its curve; at full the sheet leaves no map to recenter.
// aria-disabled instead of disabled while busy: a disabled button would lose the focus the
// user just put on it.
export function RecenterButton({ snap, isRecentering, onRecenter }: RecenterButtonProps) {
  const sheetOverlap = useBottomSheetOverlap(snap);
  if (snap === 'full') return null;

  return (
    <button
      type="button"
      aria-label="Centrar en mi posición"
      aria-busy={isRecentering || undefined}
      aria-disabled={isRecentering || undefined}
      onClick={isRecentering ? undefined : onRecenter}
      style={{ bottom: sheetOverlap + SHEET_GAP_PX }}
      className="absolute right-4 z-10 flex size-12 items-center justify-center rounded-full bg-surface text-fg shadow-float transition-[bottom] duration-320 ease-sheet hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none aria-disabled:cursor-wait aria-disabled:text-fg-muted"
    >
      <LocationIcon className="size-5" />
    </button>
  );
}
