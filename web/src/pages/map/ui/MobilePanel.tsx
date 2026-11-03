import type { Ref } from 'react';
import { DataAttribution } from '@/shared/ui';
import { StationDetail } from '@/widgets/station-detail';
import { StationList } from '@/widgets/station-list';
import type { MapLocation } from '../model/useMapLocation';

type MobilePanelProps = {
  ref: Ref<HTMLDivElement>;
  location: MapLocation;
  isStationOpen: boolean;
};

export function MobilePanel({ ref, location, isStationOpen }: MobilePanelProps) {
  return (
    <div ref={ref} className="flex min-h-full flex-col gap-4">
      {isStationOpen ? (
        <StationDetail center={location.center} />
      ) : (
        <StationList
          center={location.center}
          isApproximateLocation={location.isApproximateLocation}
          isLocationDenied={location.isLocationDenied}
          layout="mobile"
          onLocate={location.locate}
          isLocating={location.status === 'pending'}
        />
      )}
      <footer className="mt-auto">
        <DataAttribution />
      </footer>
    </div>
  );
}
