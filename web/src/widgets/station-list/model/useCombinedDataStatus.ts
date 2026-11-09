import {
  type Coordinates,
  type DataStatus,
  type Need,
  useAllStations,
  useDataStatus,
} from '@/entities/station';
import { useNearbyList } from './useNearbyList';

type CombinedDataStatus = {
  status: DataStatus;
  updatedAt: Date | undefined;
  // Settles once both lists have answered, so «Reintentar» stays busy until then.
  retry: () => Promise<unknown>;
};

// Offline first, as in dataStatus: both lists share the connection, so offline never mixes.
const SEVERITY = { ok: 0, loading: 1, stale: 2, error: 3, offline: 4 } as const satisfies Record<
  DataStatus,
  number
>;

function worse(first: DataStatus, second: DataStatus): DataStatus {
  return SEVERITY[first] >= SEVERITY[second] ? first : second;
}

function older(first: Date | undefined, second: Date | undefined): Date | undefined {
  if (!first || !second) return first ?? second;
  return first < second ? first : second;
}

// The panel shows the nearby list and the favorites, which come from the full list: either one
// unconfirmed makes the panel unconfirmed, as old as its older data.
export function useCombinedDataStatus(
  center: Coordinates | undefined,
  need: Need,
): CombinedDataStatus {
  const nearby = useNearbyList(center, need);
  const all = useDataStatus(useAllStations());
  return {
    status: worse(nearby.status, all.status),
    updatedAt: older(nearby.updatedAt, all.updatedAt),
    retry: () => Promise.allSettled([nearby.retry(), all.retry()]),
  };
}
