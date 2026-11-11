import { useId } from 'react';
import { type Coordinates, useStationDetail } from '@/entities/station';
import { cardHeading } from '../model/cardHeading';
import { useCloseOnEscape } from '@/shared/lib';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
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
  const cardRef = useCloseOnEscape(onClose);

  return (
    <section
      aria-labelledby={headingId}
      ref={cardRef}
      className="absolute top-4 right-4 flex w-80 max-w-[calc(100%-2rem)] flex-col gap-3 rounded-card bg-surface p-4.5 shadow-float"
    >
      <CardHeader
        headingId={headingId}
        heading={cardHeading(number, detail)}
        center={center}
        onClose={onClose}
      />
      <CardBody number={number} detail={detail} onClose={onClose} />
      <CardFooter detail={detail} />
    </section>
  );
}
