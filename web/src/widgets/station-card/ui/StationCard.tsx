import type { Coordinates } from '@/entities/station';
import { useSelectedStation } from '@/features/select-station';
import { SelectedStationCard } from './SelectedStationCard';

type StationCardProps = {
  // Center of the nearby list: the distance is read from it. Undefined hides the distance.
  center: Coordinates | undefined;
};

export function StationCard({ center }: StationCardProps) {
  const { number, clear } = useSelectedStation();

  if (number === undefined) return null;
  return <SelectedStationCard key={number} number={number} center={center} onClose={clear} />;
}
