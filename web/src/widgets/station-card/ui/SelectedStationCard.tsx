import { useId } from 'react';
import { type Coordinates, useStationDetail } from '@/entities/station';
import { useCloseOnEscape } from '../model/useCloseOnEscape';
import { CardBody } from './CardBody';
import { CardHeader } from './CardHeader';

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
      <CardHeader
        headingId={headingId}
        number={number}
        station={station}
        center={center}
        onClose={onClose}
      />
      <CardBody detail={detail} />
    </section>
  );
}
