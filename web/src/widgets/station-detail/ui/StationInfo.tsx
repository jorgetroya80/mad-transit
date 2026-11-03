import {
  type Coordinates,
  type DataStatus,
  type Station,
  useStationDistance,
} from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { FavoriteButton } from '@/features/toggle-favorite';
import { StaleNotice, StatusBanner, UpdatedAt } from '@/shared/ui';
import { StationFields } from './StationFields';

type StationInfoProps = {
  station: Station;
  status: DataStatus;
  updatedAt: Date | undefined;
  center: Coordinates | undefined;
};

export function StationInfo({ station, status, updatedAt, center }: StationInfoProps) {
  const [need] = useNeed();
  const distanceMeters = useStationDistance(center, need, station.number);

  return (
    <>
      {status === 'stale' ? <StaleNotice updatedAt={updatedAt} /> : null}
      {status === 'offline' ? <StatusBanner variant="offline">Sin conexión</StatusBanner> : null}
      <StationFields station={station} status={status} distanceMeters={distanceMeters} />
      <FavoriteButton number={station.number} className="self-start" />
      {updatedAt ? <UpdatedAt date={updatedAt} /> : null}
    </>
  );
}
