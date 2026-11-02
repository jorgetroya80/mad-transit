import type { Coordinates } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { useSelectedStation } from '@/features/select-station';
import { StaleNotice, StatusBanner } from '@/shared/ui';
import { needCaption } from '../lib/needCaption';
import { useNearbyList } from '../model/useNearbyList';
import { FavoriteStations } from './FavoriteStations';
import { ApproximateLocationNotice, DesktopLocationNotice } from './LocationNotice';
import { NearbyStations } from './NearbyStations';
import { StationSection } from './StationSection';

// On desktop the location notice is always there and can ask for the position, and the
// mode cards already say what the numbers count, so the heading says how the list is sorted.
type LayoutProps = { layout?: 'mobile' } | { layout: 'desktop'; onLocate: () => void };

type StationListProps = {
  // Undefined while the location is still being resolved: the nearby list waits for it.
  center: Coordinates | undefined;
  // True when `center` is the Puerta del Sol fallback instead of the user's position.
  isApproximateLocation: boolean;
  // True when the fallback is because the user did not give the location permission.
  isLocationDenied?: boolean;
} & LayoutProps;

function LocationNotice({
  center,
  isApproximateLocation,
  isLocationDenied = false,
  ...layout
}: StationListProps) {
  if (layout.layout !== 'desktop') {
    return (
      <ApproximateLocationNotice
        isApproximateLocation={isApproximateLocation}
        isLocationDenied={isLocationDenied}
      />
    );
  }
  if (center === undefined) return null;
  return (
    <DesktopLocationNotice
      isApproximateLocation={isApproximateLocation}
      isLocationDenied={isLocationDenied}
      onLocate={layout.onLocate}
    />
  );
}

export function StationList(props: StationListProps) {
  const { center, isApproximateLocation, layout } = props;
  const [need] = useNeed();
  const { number: selectedNumber, select } = useSelectedStation();
  const nearby = useNearbyList(center, need);

  return (
    <div className="flex flex-col gap-4">
      <LocationNotice {...props} />
      {nearby.status === 'stale' ? <StaleNotice updatedAt={nearby.updatedAt} /> : null}
      {nearby.status === 'offline' && nearby.stations ? (
        <StatusBanner variant="offline">Sin conexión</StatusBanner>
      ) : null}
      <FavoriteStations need={need} selectedNumber={selectedNumber} onSelect={select} />
      <StationSection
        section="nearby"
        heading={isApproximateLocation ? 'Cerca de la Puerta del Sol' : 'Cerca de ti'}
        caption={layout === 'desktop' ? 'Ordenadas por distancia' : needCaption(need)}
      >
        <NearbyStations
          list={nearby}
          need={need}
          selectedNumber={selectedNumber}
          onSelect={select}
        />
      </StationSection>
    </div>
  );
}
