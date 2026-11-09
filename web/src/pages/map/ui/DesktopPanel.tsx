import { NeedToggle } from '@/features/filter-by-need';
import { DataAttribution } from '@/shared/ui';
import { AvailabilityLegend, StationList } from '@/widgets/station-list';
import { TransitSearch } from '@/widgets/transit-search';
import type { MapLocation } from '../model/useMapLocation';

type DesktopPanelProps = { location: MapLocation };

// The list stays even with a station selected: the station shows over the map instead.
export function DesktopPanel({ location }: DesktopPanelProps) {
  return (
    <div className="flex min-h-full flex-col gap-4">
      <TransitSearch center={location.center} />
      <NeedToggle variant="cards" />
      <StationList
        center={location.center}
        isApproximateLocation={location.isApproximateLocation}
        isLocationDenied={location.isLocationDenied}
        layout="desktop"
        onLocate={location.locate}
        isLocating={location.status === 'pending'}
      />
      <footer className="mt-auto flex flex-col gap-3">
        <AvailabilityLegend />
        <DataAttribution />
      </footer>
    </div>
  );
}
