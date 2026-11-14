import type { ArrivalRef } from '@/entities/bus-stop';
import { useSelectedStop } from '@/features/select-stop';
import { type GeoPosition, useKeptFocus } from '@/shared/lib';
import { BaseMap, type FocusPadding, type MapControlsOptions } from '@/shared/ui';
import { BUS_POINT_ID } from '../lib/toBusPoint';
import { useMapPoints } from '../model/useMapPoints';
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
  // The bus to draw beside the selected stop: its position comes from the stop's arrivals.
  shownArrival?: ArrivalRef;
  className?: string;
};

export function BusStopsMap({
  center,
  mapCenter,
  userLocation,
  label,
  focusPadding,
  focusSelected = true,
  onSelect,
  controls,
  shownArrival,
  className,
}: BusStopsMapProps) {
  const { number, select, clear } = useSelectedStop();
  const { points, fitPoints } = useMapPoints(center, number, shownArrival);
  const selected = points.find((point) => point.id === number);
  const focus = useKeptFocus(selected && focusSelected ? selected : undefined, mapCenter);
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
        if (id === BUS_POINT_ID) return;
        onSelect?.(id);
        select(id);
      }}
      focus={focus}
      fitPoints={fitPoints}
      focusPadding={focusPadding}
      userLocation={userLocation}
      controls={controls}
      popup={popup}
    />
  );
}
