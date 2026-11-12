import { IconButton, type SheetSnap, useBottomSheetOverlap } from '@/shared/ui';

type RecenterButtonProps = {
  snap: SheetSnap;
  isRecentering: boolean;
  onRecenter: () => void;
  // Placement from the page: the button sits against the bottom of its containing block.
  className?: string;
};

const SHEET_GAP_PX = 16;

// Rides 16 px above the sheet with its curve, at both heights. Busy rather than disabled while
// recentering: a disabled button would lose the focus the user just put on it.
export function RecenterButton({
  snap,
  isRecentering,
  onRecenter,
  className = '',
}: RecenterButtonProps) {
  const sheetOverlap = useBottomSheetOverlap(snap);

  return (
    <div
      style={{ bottom: sheetOverlap + SHEET_GAP_PX }}
      className={`absolute right-4 z-10 flex transition-[bottom] duration-320 ease-sheet motion-reduce:transition-none ${className}`}
    >
      <IconButton
        label="Centrar en mi posición"
        icon="locate"
        variant="floating"
        size="lg"
        iconTone="primary"
        iconSize={22}
        busy={isRecentering}
        onClick={onRecenter}
      />
    </div>
  );
}
