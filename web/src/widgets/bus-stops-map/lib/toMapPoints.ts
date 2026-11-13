import type { Arrival, BusStop } from '@/entities/bus-stop';
import type { MapPoint } from '@/shared/ui';
import { toBusPoint } from './toBusPoint';
import { toStopPoints } from './toStopPoints';

// Frames the selected stop and the bus together, so a shown bus always comes with its stop.
export function toMapPoints(
  stops: readonly Pick<BusStop, 'number' | 'lat' | 'lon'>[],
  selectedNumber: string | undefined,
  bus: Arrival | undefined,
): { points: MapPoint[]; fitPoints?: MapPoint[] } {
  const stopPoints = toStopPoints(stops);
  const busPoint = toBusPoint(bus);
  if (!busPoint) return { points: stopPoints };
  const points = [...stopPoints, busPoint];
  const fitPoints = points.filter((point) => point.id === selectedNumber || point === busPoint);
  return { points, fitPoints };
}
