import { useMemo } from 'react';
import {
  type Coordinates,
  isSameStationNumber,
  type Station,
  useAllStations,
  useDataStatus,
} from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { useSelectedStation } from '@/features/select-station';
import { BaseMap, type FocusPadding, type MapControlsOptions } from '@/shared/ui';
import { toMapPoints } from '../lib/toMapPoints';
import { type MapLayout, MapNotice } from './MapNotice';

type StationsMapProps = {
  // Where the list is, so the offline layer can point to it.
  layout: MapLayout;
  center: Coordinates | undefined;
  userLocation: Coordinates | undefined;
  label?: string;
  focusPadding?: FocusPadding;
  // False keeps the selected station marked but centers the map on `center` instead.
  focusSelected?: boolean;
  // Called on every tapped point, also the station already selected, which does not change the URL.
  onSelect?: (number: string) => void;
  controls?: MapControlsOptions;
  className?: string;
};

// Module-level so the map keeps the same array while the stations load or fail.
const NO_STATIONS: readonly Station[] = [];

function findStation(stations: readonly Station[], number: string | undefined) {
  return stations.find((station) => isSameStationNumber(station.number, number));
}

// The map never blocks on the stations: the list shows loading and errors, and the notices lie
// over the map as its siblings, so MapLibre stays mounted whatever the status.
export function StationsMap({
  layout,
  center,
  userLocation,
  label,
  focusPadding,
  focusSelected = true,
  onSelect,
  controls,
  className,
}: StationsMapProps) {
  const query = useAllStations();
  const { status } = useDataStatus(query);
  const { data } = query;
  const [need] = useNeed();
  const { number, select } = useSelectedStation();
  const stations = data?.stations ?? NO_STATIONS;
  // Stable while stations, need and status stay the same, so the map only resets its data on
  // real changes.
  const points = useMemo(() => toMapPoints(stations, need, status), [stations, need, status]);
  const selected = findStation(stations, number);

  return (
    <div className={['relative isolate', className].filter(Boolean).join(' ')}>
      <BaseMap
        className="h-full w-full"
        label={label}
        points={points}
        selectedId={selected?.number}
        onSelectPoint={(id) => {
          onSelect?.(id);
          select(id);
        }}
        focus={selected && focusSelected ? { lng: selected.lon, lat: selected.lat } : center}
        focusPadding={focusPadding}
        userLocation={userLocation}
        controls={controls}
      />
      <MapNotice status={status} hasData={data !== undefined} layout={layout} />
    </div>
  );
}
