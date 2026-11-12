import { useId } from 'react';
import { type Coordinates, useStationDetail } from '@/entities/station';
import { FavoriteButton } from '@/features/toggle-favorite';
import { Card, IconButton } from '@/shared/ui';
import { cardHeading } from '../model/cardHeading';
import { useStationMeta } from '../model/useStationMeta';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';

type SelectedStationCardProps = {
  number: string;
  center: Coordinates | undefined;
  onClose: () => void;
};

// Opening it leaves the focus where it was: the user keeps browsing the list or the map.
export function SelectedStationCard({ number, center, onClose }: SelectedStationCardProps) {
  const detail = useStationDetail(number);
  const titleId = useId();
  const heading = cardHeading(number, detail);
  const meta = useStationMeta(heading, center);

  return (
    <div className="absolute top-4 right-4 w-80 max-w-[calc(100%-2rem)]">
      <Card titleId={titleId} onEscape={onClose}>
        <Card.Header
          titleId={titleId}
          title={heading.title}
          meta={meta}
          cornerActions={<IconButton label="Cerrar" icon="close" onClick={onClose} />}
          titleAction={heading.station ? <FavoriteButton number={heading.station.number} /> : null}
        />
        <CardBody number={number} detail={detail} onClose={onClose} />
        <CardFooter detail={detail} />
      </Card>
    </div>
  );
}
