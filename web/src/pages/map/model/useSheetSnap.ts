import { useState } from 'react';
import type { SheetSnap } from '@/shared/ui';

const LIST_NEXT_SNAP = { peek: 'half', half: 'full', full: 'half' } as const satisfies Record<
  SheetSnap,
  SheetSnap
>;

// The sheet starts at half. Selecting a station (map, list, search or link) lifts it from
// peek, so the detail shows. State is adjusted during render, so the detail mounts already
// outside the inert peek body.
export function useSheetSnap(selectedStation: string | undefined) {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [shownStation, setShownStation] = useState(selectedStation);

  if (selectedStation !== shownStation) {
    setShownStation(selectedStation);
    if (selectedStation !== undefined && snap === 'peek') setSnap('half');
  }

  return {
    snap,
    setSnap,
    nextSnap: LIST_NEXT_SNAP,
    handleLabel: snap === 'full' ? 'Reducir lista' : 'Ampliar lista',
  };
}
