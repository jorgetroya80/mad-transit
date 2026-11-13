import {
  type Coordinates,
  type Station,
  useAllStations,
  useNearbyStations,
} from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import type { SearchItem, SearchSource } from '@/features/search-by-number';
import { useSelectedStation } from '@/features/select-station';
import { useMemo } from 'react';
import { UNAVAILABLE_TEXT } from './unavailableText';
import { type DataStatus, useDataStatus } from '@/shared/lib';

const BICIMAD_SOURCE_ID = 'bicimad';
const BICIMAD_LABEL = 'BiciMAD';
const STATION_LABEL = 'estación';
const STATION_LABEL_PLURAL = 'estaciones';
const NO_ITEMS: readonly SearchItem[] = [];

type UnavailableStatus = Extract<DataStatus, 'error' | 'offline'>;

const SAVED_PLACEHOLDER = 'Busca entre las estaciones guardadas';

function isUnavailableStatus(status: DataStatus): status is UnavailableStatus {
  return status in UNAVAILABLE_TEXT;
}

// Stations from an earlier success or the saved list stay searchable whatever the status.
// Without them, offline reads as an error like a failed request.
function sourceStatus(hasData: boolean, status: DataStatus): SearchSource['status'] {
  if (hasData) return 'ready';
  return status === 'loading' ? 'loading' : 'error';
}

function toSearchItem({ number, name, address }: Station): SearchItem {
  return { number, title: name, subtitle: address };
}

// The nearby list comes sorted by distance, so its first station is the nearest. It is the
// same query as the list's, so it costs no request.
function useNearestStation(center: Coordinates | undefined): Station | undefined {
  const [need] = useNeed();
  return useNearbyStations(center, need).data?.stations[0];
}

export function useBicimadSource(center: Coordinates | undefined): SearchSource {
  const query = useAllStations();
  const nearest = useNearestStation(center);
  const { status: dataStatus } = useDataStatus(query);
  const { select } = useSelectedStation();
  const stations = query.data?.stations;
  const hasData = stations !== undefined;
  const status = sourceStatus(hasData, dataStatus);
  const unavailableText =
    !hasData && isUnavailableStatus(dataStatus) ? UNAVAILABLE_TEXT[dataStatus] : undefined;
  const placeholder = hasData && dataStatus === 'offline' ? SAVED_PLACEHOLDER : undefined;

  const items = useMemo(() => stations?.map(toSearchItem) ?? NO_ITEMS, [stations]);
  const suggestion = useMemo(() => nearest && toSearchItem(nearest), [nearest]);

  // Stable while nothing changes, so polling with identical data does not re-render the search.
  return useMemo(
    () => ({
      id: BICIMAD_SOURCE_ID,
      label: BICIMAD_LABEL,
      itemLabel: STATION_LABEL,
      itemLabelPlural: STATION_LABEL_PLURAL,
      items,
      status,
      unavailableText,
      placeholder,
      suggestion,
      onSelect: select,
    }),
    [items, status, unavailableText, placeholder, suggestion, select],
  );
}
