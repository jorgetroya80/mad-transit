import type { Coordinates } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { useSelectedStation } from '@/features/select-station';
import { StaleNotice, StatusBanner } from '@/shared/ui';
import { needCaption } from '../lib/needCaption';
import { useNearbyList } from '../model/useNearbyList';
import { FavoriteStations } from './FavoriteStations';
import { NearbyStations } from './NearbyStations';
import { StationSection } from './StationSection';

type StationListProps = {
  // Undefined while the location is still being resolved: the nearby list waits for it.
  center: Coordinates | undefined;
  // True when `center` is the Puerta del Sol fallback instead of the user's position.
  isApproximateLocation: boolean;
  // True when the fallback is because the user did not give the location permission.
  isLocationDenied?: boolean;
};

export function StationList({
  center,
  isApproximateLocation,
  isLocationDenied = false,
}: StationListProps) {
  const [need] = useNeed();
  const { select } = useSelectedStation();
  const nearby = useNearbyList(center, need);

  return (
    <div className="flex flex-col gap-4">
      {isApproximateLocation ? (
        <StatusBanner variant="info">
          {isLocationDenied
            ? 'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol'
            : 'Sin ubicación: mostrando estaciones cerca de la Puerta del Sol'}
        </StatusBanner>
      ) : null}
      {nearby.status === 'stale' ? <StaleNotice updatedAt={nearby.updatedAt} /> : null}
      {nearby.status === 'offline' && nearby.stations ? (
        <StatusBanner variant="offline">Sin conexión</StatusBanner>
      ) : null}
      <FavoriteStations need={need} onSelect={select} />
      <StationSection
        section="nearby"
        heading={isApproximateLocation ? 'Cerca de la Puerta del Sol' : 'Cerca de ti'}
        caption={needCaption(need)}
      >
        <NearbyStations list={nearby} need={need} onSelect={select} />
      </StationSection>
    </div>
  );
}
