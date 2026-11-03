import { useState } from 'react';
import type { SheetSnap } from '@/shared/ui';

const LIST_NEXT_SNAP = { peek: 'half', half: 'full', full: 'half' } as const satisfies Record<
  SheetSnap,
  SheetSnap
>;

// The detail never takes full: the handle only toggles it between its header and half.
const DETAIL_NEXT_SNAP = { peek: 'half', half: 'peek', full: 'half' } as const satisfies Record<
  SheetSnap,
  SheetSnap
>;

function handleLabelFor(snap: SheetSnap, isStationOpen: boolean): string {
  if (isStationOpen) return snap === 'peek' ? 'Ampliar detalle' : 'Reducir detalle';
  return snap === 'full' ? 'Reducir lista' : 'Ampliar lista';
}

// The sheet starts at half. Opening a station (map, list, search or link) shows its detail at
// half and remembers the list's height, which closing it brings back; another station opened
// meanwhile keeps both. State is adjusted during render, so the detail mounts already outside
// the inert peek body.
export function useSheetSnap(selectedStation: string | undefined) {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [listSnap, setListSnap] = useState<SheetSnap>('half');
  const [shownStation, setShownStation] = useState(selectedStation);
  const isStationOpen = selectedStation !== undefined;

  if (selectedStation !== shownStation) {
    setShownStation(selectedStation);
    if (!isStationOpen) {
      setSnap(listSnap);
    } else if (shownStation === undefined) {
      setListSnap(snap);
      setSnap('half');
    }
  }

  return {
    snap,
    setSnap,
    nextSnap: isStationOpen ? DETAIL_NEXT_SNAP : LIST_NEXT_SNAP,
    handleLabel: handleLabelFor(snap, isStationOpen),
  };
}
