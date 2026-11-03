import { LocationIcon, MinusIcon, PlusIcon } from '../icons';

// The zoom buttons are always there; recentering only with `onRecenter`.
export type MapControlsOptions = {
  onRecenter?: () => void;
  isRecentering?: boolean;
};

type MapControlsProps = MapControlsOptions & {
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const BUTTON_CLASS =
  'flex size-11 items-center justify-center rounded-control bg-surface text-fg shadow-control hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// Above the compact attribution, which MapLibre puts in the bottom right corner from md up.
// Recentering uses aria-disabled instead of disabled while busy: a disabled button would lose
// the focus the user just put on it.
export function MapControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  isRecentering = false,
}: MapControlsProps) {
  return (
    <div className="absolute right-4 bottom-12 z-10 flex flex-col gap-2">
      <button type="button" aria-label="Acercar" className={BUTTON_CLASS} onClick={onZoomIn}>
        <PlusIcon className="size-5" />
      </button>
      <button type="button" aria-label="Alejar" className={BUTTON_CLASS} onClick={onZoomOut}>
        <MinusIcon className="size-5" />
      </button>
      {onRecenter && (
        <button
          type="button"
          aria-label="Centrar en mi posición"
          aria-busy={isRecentering || undefined}
          aria-disabled={isRecentering || undefined}
          className={`${BUTTON_CLASS} aria-disabled:cursor-wait aria-disabled:text-fg-muted`}
          onClick={isRecentering ? undefined : onRecenter}
        >
          <LocationIcon className="size-5" />
        </button>
      )}
    </div>
  );
}
