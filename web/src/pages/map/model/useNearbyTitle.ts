import type { Coordinates, Need } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { SAVED_LIST_TITLE, useNearbyAvailability } from '@/widgets/station-list';

const NEED_NOUN = { bikes: 'bicis', docks: 'hueco' } as const satisfies Record<Need, string>;

// Without data there is nothing to count yet, so the title only says what the list is.
function availabilityTitle(count: number | undefined, need: Need): string {
  if (count === undefined) return 'Estaciones cercanas';
  return `${count} ${count === 1 ? 'estación' : 'estaciones'} con ${NEED_NOUN[need]}`;
}

// «N estaciones con bicis» (or «con hueco») for the sheet header and its hidden strip; offline
// with data, «Últimos datos guardados», since the counts may be out of date.
export function useNearbyTitle(center: Coordinates | undefined) {
  const [need] = useNeed();
  const { count, updatedAt, isSaved } = useNearbyAvailability(center, need);
  const title = isSaved ? SAVED_LIST_TITLE : availabilityTitle(count, need);
  return { title, updatedAt, isSaved };
}
