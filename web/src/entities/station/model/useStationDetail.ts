import { StationNotFoundError } from '../api/StationNotFoundError';
import { useAllStations, useStation } from '../api/stationQueries';
import { isSameStationNumber } from './stationNumber';
import type { DataStatus, Station } from './types';
import { useDataStatus } from './useDataStatus';

export type StationDetailState =
  | { status: 'not-found' }
  | {
      status: DataStatus;
      // Undefined without data from the detail or the full list.
      station: Station | undefined;
      updatedAt: Date | undefined;
      // Returns the refetch promise, so «Reintentar» can show the request as busy.
      retry: () => unknown;
    };

function findStation(stations: readonly Station[] | undefined, number: string) {
  return stations?.find((station) => isSameStationNumber(station.number, number));
}

// Not found wins over any data: a station the API no longer has should not stay on screen.
// Without its own data (loading, failed or offline), the detail falls back to the station in the
// full list, possibly the saved one, with that list's status. Retry always asks for the detail.
export function useStationDetail(number: string): StationDetailState {
  const detail = useStation(number);
  const own = useDataStatus(detail);
  const all = useAllStations();
  const list = useDataStatus(all);

  if (detail.error instanceof StationNotFoundError) return { status: 'not-found' };
  if (detail.data) return { ...own, station: detail.data.station };
  const listed = findStation(all.data?.stations, number);
  if (listed)
    return { status: list.status, updatedAt: list.updatedAt, station: listed, retry: own.retry };
  return { ...own, station: undefined };
}
