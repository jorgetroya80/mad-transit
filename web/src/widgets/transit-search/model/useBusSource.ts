import { type BusStop, useAllStops } from '@/entities/bus-stop';
import type { SearchItem, SearchSource } from '@/features/search-by-number';
import { useSelectedStop } from '@/features/select-stop';
import { useOnline } from '@/shared/lib';
import { useMemo } from 'react';
import { UNAVAILABLE_TEXT } from './unavailableText';

const BUS_SOURCE_ID = 'bus';
const BUS_LABEL = 'Bus';
const STOP_LABEL = 'parada';
const STOP_LABEL_PLURAL = 'paradas';
const NO_ITEMS: readonly SearchItem[] = [];

function toSearchItem({ number, name }: BusStop): SearchItem {
  return { number, title: name };
}

function sourceStatus(hasData: boolean, failed: boolean, online: boolean): SearchSource['status'] {
  if (hasData) return 'ready';
  return online && !failed ? 'loading' : 'error';
}

function unavailableTextFor(hasData: boolean, failed: boolean, online: boolean) {
  if (hasData) return undefined;
  if (!online) return UNAVAILABLE_TEXT.offline;
  return failed ? UNAVAILABLE_TEXT.error : undefined;
}

// Every stop of the city, asked only while Bus is chosen. Stops are not saved offline, so
// without them the box says when they will be back.
export function useBusSource(): SearchSource {
  const query = useAllStops();
  const online = useOnline();
  const { select } = useSelectedStop();
  const stops = query.data?.stops;
  const hasData = stops !== undefined;
  const status = sourceStatus(hasData, query.isError, online);
  const unavailableText = unavailableTextFor(hasData, query.isError, online);

  const items = useMemo(() => stops?.map(toSearchItem) ?? NO_ITEMS, [stops]);

  // Stable while nothing changes, so polling with identical data does not re-render the search.
  return useMemo(
    () => ({
      id: BUS_SOURCE_ID,
      label: BUS_LABEL,
      itemLabel: STOP_LABEL,
      itemLabelPlural: STOP_LABEL_PLURAL,
      items,
      status,
      unavailableText,
      onSelect: select,
    }),
    [items, status, unavailableText, select],
  );
}
