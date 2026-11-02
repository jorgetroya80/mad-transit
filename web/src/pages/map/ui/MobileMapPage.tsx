import { useSelectedStation } from '@/features/select-station';
import { AppLayout } from '@/widgets/app-layout';
import { StationsMap } from '@/widgets/stations-map';
import { useListFocusReturn } from '../model/useListFocusReturn';
import { useMapFocusPadding } from '../model/useMapFocusPadding';
import { useMapLocation } from '../model/useMapLocation';
import { usePanelExpanded } from '../model/usePanelExpanded';
import { useUserFocus } from '../model/useUserFocus';
import { MapPanel } from './MapPanel';

export function MobileMapPage() {
  const location = useMapLocation();
  const { number } = useSelectedStation();
  const [panelExpanded, setPanelExpanded] = usePanelExpanded(number);
  const panelRef = useListFocusReturn(number);
  const focusPadding = useMapFocusPadding(panelExpanded);
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
      panelExpanded={panelExpanded}
      onPanelExpandedChange={setPanelExpanded}
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
