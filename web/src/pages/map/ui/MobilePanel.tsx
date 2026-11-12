import type { Ref } from 'react';
import type { MapLocation } from '@/shared/lib';
import { DataAttribution } from '@/shared/ui';
import { StationList } from '@/widgets/station-list';

type MobilePanelProps = {
  ref: Ref<HTMLDivElement>;
  location: MapLocation;
};

export function MobilePanel({ ref, location }: MobilePanelProps) {
  return (
    <div ref={ref} className="flex min-h-full flex-col gap-4">
      <StationList
        center={location.center}
        isApproximateLocation={location.isApproximateLocation}
        isLocationDenied={location.isLocationDenied}
        layout="mobile"
        onLocate={location.locate}
        isLocating={location.status === 'pending'}
      />
      <footer className="mt-auto">
        <DataAttribution />
      </footer>
    </div>
  );
}
