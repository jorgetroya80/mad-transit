import {
  availabilityFor,
  availabilityLabel,
  availabilityTone,
  type Need,
  type Station,
} from '@/entities/station';
import type { MapPoint } from '@/shared/ui';
import { type DataStatus } from '@/shared/lib';

type MapStation = Pick<Station, 'number' | 'lat' | 'lon' | 'status' | 'bikes' | 'freeDocks'>;

function toMapPoint(station: MapStation, need: Need, status: DataStatus): MapPoint {
  const availability = availabilityFor(station, need, status);
  return {
    id: station.number,
    lng: station.lon,
    lat: station.lat,
    tone: availabilityTone(availability.level),
    value: availabilityLabel(availability),
  };
}

export function toMapPoints(
  stations: readonly MapStation[],
  need: Need,
  status: DataStatus,
): MapPoint[] {
  return stations.map((station) => toMapPoint(station, need, status));
}
