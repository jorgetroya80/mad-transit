import { type Coordinates, formatDistance, useStationDistance } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import type { CardHeading } from './cardHeading';

// «Estación 1a · 12 m»: the distance only for a station that exists and a known center.
export function useStationMeta(
  { metaNumber, station }: CardHeading,
  center: Coordinates | undefined,
): string | undefined {
  const [need] = useNeed();
  const distanceMeters = useStationDistance(station ? center : undefined, need, metaNumber ?? '');
  if (!metaNumber) return undefined;
  const distance = distanceMeters === undefined ? [] : [formatDistance(distanceMeters)];
  return [`Estación ${metaNumber}`, ...distance].join(' · ');
}
