import { useState } from 'react';
import type { SheetSnap } from '@/shared/ui';

// The sheet starts at half. Opening a station (map, list, search or link) shows its detail at
// half and remembers the list's height, which closing it brings back; another station opened
// meanwhile keeps both. State is adjusted during render, so the detail mounts already outside
// the inert hidden sheet.
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

  return { snap, setSnap, hideLabel: isStationOpen ? 'Ocultar detalle' : 'Ocultar lista' };
}
