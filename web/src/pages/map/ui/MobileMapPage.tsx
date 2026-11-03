import { useState } from 'react';
import { useSelectedStation } from '@/features/select-station';
import type { SheetSnap } from '@/shared/ui';
import { AppLayout } from '@/widgets/app-layout';
import { StationsMap } from '@/widgets/stations-map';
import { useListFocusReturn } from '../model/useListFocusReturn';
import { useMapFocusPadding } from '../model/useMapFocusPadding';
import { useMapLocation } from '../model/useMapLocation';
import { usePanelExpanded } from '../model/usePanelExpanded';
import { useUserFocus } from '../model/useUserFocus';
import { MapPanel } from './MapPanel';

const LIST_NEXT_SNAP: Record<SheetSnap, SheetSnap> = { peek: 'half', half: 'full', full: 'half' };

// Interim: keeps the expanded / collapsed state of today as `half` / `peek`, plus `full`.
function usePanelSnap(selectedStation: string | undefined) {
  const [panelExpanded, setPanelExpanded] = usePanelExpanded(selectedStation);
  const [isPanelFull, setPanelFull] = useState(false);
  const fullOrHalf: SheetSnap = isPanelFull ? 'full' : 'half';
  const snap: SheetSnap = panelExpanded ? fullOrHalf : 'peek';

  function changeSnap(next: SheetSnap) {
    setPanelExpanded(next !== 'peek');
    setPanelFull(next === 'full');
  }

  return [snap, changeSnap] as const;
}

export function MobileMapPage() {
  const location = useMapLocation();
  const { number } = useSelectedStation();
  const [panelSnap, setPanelSnap] = usePanelSnap(number);
  const panelRef = useListFocusReturn(number);
  const focusPadding = useMapFocusPadding(panelSnap);
  const { focusSelected, focusSelection, locate } = useUserFocus(number, location.locate);

  return (
    <AppLayout
      title="Mad Transit"
      map={
        <StationsMap
          center={location.mapCenter}
          userLocation={location.userLocation}
          focusPadding={focusPadding}
          focusSelected={focusSelected}
          onSelect={focusSelection}
          className="h-full w-full"
        />
      }
      panelLabel="Estaciones"
      panelSnap={panelSnap}
      onPanelSnapChange={setPanelSnap}
      panelNextSnap={LIST_NEXT_SNAP}
      panelHandleLabel={panelSnap === 'full' ? 'Reducir lista' : 'Ampliar lista'}
      panel={
        <MapPanel
          ref={panelRef}
          location={{ ...location, locate }}
          isStationOpen={number !== undefined}
        />
      }
    />
  );
}
