import type { Coordinates, Need } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { useSelectedStation } from '@/features/select-station';
import { StaleNotice, StatusBanner } from '@/shared/ui';
import { needCaption } from '../lib/needCaption';
import { useNearbyList } from '../model/useNearbyList';
import { FavoriteStations } from './FavoriteStations';
import { ApproximateLocationNotice, type LocatingLayout, LocatingNotice } from './LocationNotice';
import { NearbyStations } from './NearbyStations';
import { StationSection } from './StationSection';

// On desktop and mobile the location notice is always there and can ask for the position, and
// the mode already says what the numbers count. On desktop the heading says how the list is
// sorted; on mobile it sits under the sheet header, which names the place and the list's age.
type LayoutProps =
  | { layout?: undefined }
  | { layout: LocatingLayout; onLocate: () => void; isLocating?: boolean };

type StationListProps = {
  // Undefined while the location is still being resolved: the nearby list waits for it.
  center: Coordinates | undefined;
  // True when `center` is the Puerta del Sol fallback instead of the user's position.
  isApproximateLocation: boolean;
  // True when the fallback is because the user did not give the location permission.
  isLocationDenied?: boolean;
} & LayoutProps;

type NearbyHeading = { heading: string; caption?: string; level: 2 | 3 };

function nearbyHeading(
  layout: LocatingLayout | undefined,
  isApproximateLocation: boolean,
  need: Need,
): NearbyHeading {
  if (layout === 'mobile') return { heading: 'Cercanas', level: 3 };
  const heading = isApproximateLocation ? 'Cerca de la Puerta del Sol' : 'Cerca de ti';
  const caption = layout === 'desktop' ? 'Ordenadas por distancia' : needCaption(need);
  return { heading, caption, level: 2 };
}

function LocationNotice({
  center,
  isApproximateLocation,
  isLocationDenied = false,
  ...layoutProps
}: StationListProps) {
  if (layoutProps.layout === undefined) {
    return (
      <ApproximateLocationNotice
        isApproximateLocation={isApproximateLocation}
        isLocationDenied={isLocationDenied}
      />
    );
  }
  if (center === undefined) return null;
  return (
    <LocatingNotice
      isApproximateLocation={isApproximateLocation}
      isLocationDenied={isLocationDenied}
      layout={layoutProps.layout}
      onLocate={layoutProps.onLocate}
      isLocating={layoutProps.isLocating ?? false}
    />
  );
}

export function StationList(props: StationListProps) {
  const { center, isApproximateLocation, layout } = props;
  const [need] = useNeed();
  const { number: selectedNumber, select } = useSelectedStation();
  const nearby = useNearbyList(center, need);
  const { level, ...heading } = nearbyHeading(layout, isApproximateLocation, need);

  return (
    <div className="flex flex-col gap-4">
      <LocationNotice {...props} />
      {nearby.status === 'stale' ? <StaleNotice updatedAt={nearby.updatedAt} /> : null}
      {nearby.status === 'offline' && nearby.stations ? (
        <StatusBanner variant="offline">Sin conexión</StatusBanner>
      ) : null}
      <FavoriteStations
        need={need}
        selectedNumber={selectedNumber}
        onSelect={select}
        isCollapsible={layout !== undefined}
        level={level}
      />
      <StationSection section="nearby" level={level} {...heading}>
        <NearbyStations
          list={nearby}
          need={need}
          selectedNumber={selectedNumber}
          onSelect={select}
          showUpdatedAt={layout !== 'mobile'}
        />
      </StationSection>
    </div>
  );
}
