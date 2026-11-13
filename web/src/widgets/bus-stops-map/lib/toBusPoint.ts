import type { Arrival } from '@/entities/bus-stop';
import type { MapPoint } from '@/shared/ui';

// Not a stop number, so a tap on the bus selects no stop.
export const BUS_POINT_ID = 'bus';

// Drawn from the fresh arrival, so it moves with every poll and goes with an expired one.
export function toBusPoint(arrival: Arrival | undefined): MapPoint | undefined {
  if (!arrival || arrival.busLat === null || arrival.busLon === null) return undefined;
  return {
    id: BUS_POINT_ID,
    lng: arrival.busLon,
    lat: arrival.busLat,
    shape: 'pill',
    icon: 'bus',
    value: arrival.line,
    tone: 'info',
    fill: 'tag',
  };
}
