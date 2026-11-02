import { type Coordinates, formatDistance, useStationDistance } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';

type StationMetaProps = { number: string; center: Coordinates | undefined };

export function StationMeta({ number, center }: StationMetaProps) {
  const [need] = useNeed();
  const distanceMeters = useStationDistance(center, need, number);
  const distance = distanceMeters === undefined ? [] : [formatDistance(distanceMeters)];

  return (
    <p className="text-sm font-semibold text-fg-muted">
      {[`Estación ${number}`, ...distance].join(' · ')}
    </p>
  );
}
