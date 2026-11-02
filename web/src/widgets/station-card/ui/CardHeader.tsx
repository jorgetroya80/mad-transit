import type { Coordinates, Station } from '@/entities/station';
import { FavoriteButton } from '@/features/toggle-favorite';
import { CloseIcon } from '@/shared/ui';
import { StationMeta } from './StationMeta';

type CardHeaderProps = {
  headingId: string;
  number: string;
  // Undefined while loading, when not found and on error: the heading falls back to the number.
  station: Station | undefined;
  center: Coordinates | undefined;
  onClose: () => void;
};

// Two rows: meta and «Cerrar» on top, the name and its star below. The DOM order (meta, name,
// Cerrar, star) keeps the reading order and makes Tab follow the buttons top to bottom.
export function CardHeader({ headingId, number, station, center, onClose }: CardHeaderProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2">
      {station ? (
        <div className="col-start-1 row-start-1 self-center">
          <StationMeta number={station.number} center={center} />
        </div>
      ) : null}
      <h2
        id={headingId}
        className={`col-start-1 self-center text-lg leading-tight font-bold break-words text-fg ${station ? 'row-start-2' : 'row-start-1'}`}
      >
        {station?.name ?? `Estación ${number}`}
      </h2>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="col-start-2 row-start-1 -mt-2 -mr-2 flex size-11 items-center justify-center rounded-control text-fg-muted hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <CloseIcon className="size-5" />
      </button>
      {station ? (
        <FavoriteButton
          number={station.number}
          variant="icon"
          className="col-start-2 row-start-2 -mr-2 self-center"
        />
      ) : null}
    </div>
  );
}
