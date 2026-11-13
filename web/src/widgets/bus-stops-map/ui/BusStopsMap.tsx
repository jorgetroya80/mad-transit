import { useMemo } from 'react';
import { type BusStop, useNearbyStops, useStop } from '@/entities/bus-stop';
import { useSelectedStop } from '@/features/select-stop';
import type { GeoPosition } from '@/shared/lib';
import { BaseMap, type FocusPadding, type MapControlsOptions } from '@/shared/ui';
import { toStopPoints } from '../lib/toStopPoints';
import { StopPopup } from './StopPopup';

type BusStopsMapProps = {
  // Where the nearby stops are searched for; undefined while the location is pending.
  center: GeoPosition | undefined;
  // Where the map centers when no stop is selected; undefined while asking, so the answer moves it.
  mapCenter: GeoPosition | undefined;
  userLocation?: GeoPosition | undefined;
  label?: string;
  focusPadding?: FocusPadding;
  // False keeps the selected stop marked but centers the map on `mapCenter` instead.
  focusSelected?: boolean;
  // Called on every tapped point, also the stop already selected, which does not change the URL.
  onSelect?: (number: string) => void;
  controls?: MapControlsOptions;
  className?: string;
};

const NO_STOPS: readonly BusStop[] = [];

// The nearby stops, plus the selected one when it lies beyond the radius (a link or the search).
export function BusStopsMap({
  center,
  mapCenter,
  userLocation,
  label,
  focusPadding,
  focusSelected = true,
  onSelect,
  controls,
  className,
}: BusStopsMapProps) {
  const { number, select, clear } = useSelectedStop();
  const nearby = useNearbyStops(center);
  const stops = nearby.data?.stops ?? NO_STOPS;
  const isNearby = stops.some((stop) => stop.number === number);
  const { data: opened } = useStop(nearby.data && number && !isNearby ? number : undefined);
  const points = useMemo(
    () => toStopPoints(opened ? [...stops, opened.stop] : stops),
    [stops, opened],
  );
  const selected = points.find((point) => point.id === number);
  const popup = selected && {
    at: selected,
    label: `Parada ${selected.id}`,
    content: <StopPopup number={selected.id} />,
    onClose: clear,
  };

  return (
    <BaseMap
      className={className}
      label={label}
      points={points}
      selectedId={number}
      onSelectPoint={(id) => {
        onSelect?.(id);
        select(id);
      }}
      focus={selected && focusSelected ? selected : mapCenter}
      focusPadding={focusPadding}
      userLocation={userLocation}
      controls={controls}
      popup={popup}
    />
  );
}
