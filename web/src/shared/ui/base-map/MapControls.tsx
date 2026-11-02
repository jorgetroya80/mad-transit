import { LocationIcon, MinusIcon, PlusIcon } from '../icons';

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
};

const BUTTON_CLASS =
  'flex size-11 items-center justify-center rounded-control bg-surface text-fg shadow-control hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// Above the compact attribution, which MapLibre puts in the bottom right corner from md up.
export function MapControls({ onZoomIn, onZoomOut, onRecenter }: MapControlsProps) {
  return (
    <div className="absolute right-4 bottom-12 z-10 flex flex-col gap-2">
      <button type="button" aria-label="Acercar" className={BUTTON_CLASS} onClick={onZoomIn}>
        <PlusIcon className="size-5" />
      </button>
      <button type="button" aria-label="Alejar" className={BUTTON_CLASS} onClick={onZoomOut}>
        <MinusIcon className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Centrar en mi posición"
        className={BUTTON_CLASS}
        onClick={onRecenter}
      >
        <LocationIcon className="size-5" />
      </button>
    </div>
  );
}
