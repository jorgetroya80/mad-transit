import { useId } from 'react';
import { type Coordinates, useStationDetail } from '@/entities/station';
import { CloseIcon } from '@/shared/ui';
import { useCloseOnEscape } from '../model/useCloseOnEscape';
import { CardBody } from './CardBody';
import { StationMeta } from './StationMeta';

type SelectedStationCardProps = {
  number: string;
  center: Coordinates | undefined;
  onClose: () => void;
};

// Opening it leaves the focus where it was: the user keeps browsing the list or the map.
export function SelectedStationCard({ number, center, onClose }: SelectedStationCardProps) {
  const detail = useStationDetail(number);
  const headingId = useId();
  const station = detail.status === 'not-found' ? undefined : detail.station;

  const cardRef = useCloseOnEscape(onClose);

  return (
    <section
      aria-labelledby={headingId}
      ref={cardRef}
      className="absolute top-4 right-4 flex w-80 max-w-[calc(100%-2rem)] flex-col gap-3 rounded-card bg-surface p-4.5 shadow-float"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {station ? <StationMeta number={station.number} center={center} /> : null}
          <h2 id={headingId} className="text-lg leading-tight font-semibold break-words text-fg">
            {station?.name ?? `Estación ${number}`}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-control text-fg-muted hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <CardBody detail={detail} />
    </section>
  );
}
