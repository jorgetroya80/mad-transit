import type { BusStop } from '@/entities/bus-stop';
import type { MapPoint } from '@/shared/ui';

type MapStop = Pick<BusStop, 'number' | 'lat' | 'lon'>;

// Stops carry no availability, so every one keeps the same tone.
export function toStopPoints(stops: readonly MapStop[]): MapPoint[] {
  return stops.map(({ number, lat, lon }): MapPoint => ({
    id: number,
    lng: lon,
    lat,
    shape: 'square',
    icon: 'bus',
    tone: 'info',
  }));
}
