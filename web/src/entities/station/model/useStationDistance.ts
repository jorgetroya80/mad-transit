import type { Coordinates } from '../api/stationKeys';
import { useNearbyStations } from '../api/stationQueries';
import type { Need } from './types';

// Same query (and key) as the nearby list, so a list already loaded adds no request. Only
// stations within the nearby radius have a distance; the rest return undefined. Without a
// center there is no distance: the query's placeholder may still hold a list saved for an
// earlier position.
export function useStationDistance(
  center: Coordinates | undefined,
  need: Need,
  number: string,
): number | undefined {
  const { data } = useNearbyStations(center, need);
  if (!center) return undefined;
  return data?.stations.find((station) => station.number === number)?.distanceMeters;
}
