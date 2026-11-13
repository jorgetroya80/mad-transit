import type { ArrivalRef } from '@/entities/bus-stop';
import type { MapLocation } from '@/shared/lib';
import { BusStopDetail } from '@/widgets/bus-stop-detail';
import { BusStopList } from '@/widgets/bus-stop-list';

type BusPanelProps = {
  // The stop in ?stop, if any: its detail replaces the list.
  number: string | undefined;
  location: MapLocation;
  layout: 'desktop' | 'mobile';
  shownArrival?: ArrivalRef;
  onToggleOnMap?: (arrival: ArrivalRef) => void;
};

export function BusPanel({ number, location, layout, shownArrival, onToggleOnMap }: BusPanelProps) {
  if (number !== undefined) {
    return (
      <BusStopDetail
        number={number}
        center={location.center}
        layout={layout}
        shownArrival={shownArrival}
        onToggleOnMap={onToggleOnMap}
      />
    );
  }
  return (
    <BusStopList
      center={location.center}
      isApproximateLocation={location.isApproximateLocation}
      isLocationDenied={location.isLocationDenied}
      layout={layout}
      onLocate={location.locate}
      isLocating={location.status === 'pending'}
    />
  );
}
