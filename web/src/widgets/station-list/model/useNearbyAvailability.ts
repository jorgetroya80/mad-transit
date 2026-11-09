import type { Coordinates, Need, Station } from '@/entities/station';
import { useNearbyList } from './useNearbyList';

export type NearbyAvailability = {
  // Undefined without data, so the header does not say «0» before the list arrives.
  count: number | undefined;
  updatedAt: Date | undefined;
  isSaved: boolean;
};

function hasAvailable(station: Station, need: Need): boolean {
  const count = need === 'bikes' ? station.bikes : station.freeDocks;
  return station.status === 'OPERATIONAL' && count > 0;
}

// Reads the same nearby list as the sheet body (a shared query), so header and rows agree.
export function useNearbyAvailability(
  center: Coordinates | undefined,
  need: Need,
): NearbyAvailability {
  const { stations, updatedAt, isSaved } = useNearbyList(center, need);
  const count = stations?.filter((station) => hasAvailable(station, need)).length;
  return { count, updatedAt, isSaved };
}
