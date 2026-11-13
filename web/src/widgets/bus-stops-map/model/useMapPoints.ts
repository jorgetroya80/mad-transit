import { useMemo } from 'react';
import {
  type ArrivalRef,
  type BusStop,
  isSameArrival,
  useFreshArrivals,
  useNearbyStops,
  useStop,
} from '@/entities/bus-stop';
import type { GeoPosition } from '@/shared/lib';
import { toMapPoints } from '../lib/toMapPoints';

const NO_STOPS: readonly BusStop[] = [];

// The nearby stops, plus the selected one when it lies beyond the radius (a link or the search).
export function useMapPoints(
  center: GeoPosition | undefined,
  number: string | undefined,
  shownArrival: ArrivalRef | undefined,
) {
  const nearby = useNearbyStops(center);
  const stops = nearby.data?.stops ?? NO_STOPS;
  const isNearby = stops.some((stop) => stop.number === number);
  const { data: opened } = useStop(nearby.data && number && !isNearby ? number : undefined);
  const arrivals = useFreshArrivals(number);
  const bus = shownArrival && arrivals.arrivals?.find((a) => isSameArrival(a, shownArrival));
  return useMemo(
    () => toMapPoints(opened ? [...stops, opened.stop] : stops, number, bus),
    [stops, opened, number, bus],
  );
}
