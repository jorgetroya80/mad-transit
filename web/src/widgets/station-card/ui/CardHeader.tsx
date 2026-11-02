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

export function CardHeader({ headingId, number, station, center, onClose }: CardHeaderProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        {station ? <StationMeta number={station.number} center={center} /> : null}
        <h2 id={headingId} className="text-lg leading-tight font-bold break-words text-fg">
          {station?.name ?? `Estación ${number}`}
        </h2>
      </div>
      <div className="-mt-2 -mr-2 flex shrink-0">
        {station ? <FavoriteButton number={station.number} variant="icon" /> : null}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-control text-fg-muted hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
