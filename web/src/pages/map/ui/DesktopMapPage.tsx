import { useSelectedStation } from '@/features/select-station';
import { SidePanel } from '@/shared/ui';
import { AppHeader } from '@/widgets/app-header';
import { StationCard } from '@/widgets/station-card';
import { StationsMap } from '@/widgets/stations-map';
import { useListFocusReturn } from '../model/useListFocusReturn';
import { useMapLocation } from '../model/useMapLocation';
import { useUserFocus } from '../model/useUserFocus';
import { DesktopPanel } from './DesktopPanel';
import { OfflineBar } from './OfflineNotice';

// The station card (320 px wide, 16 px from each side) covers the right of the map; the side
// panel sits beside it and covers nothing.
const STATION_CARD_CLEARANCE_PX = 352;
const CARD_COVERED_MAP = { bottom: 0, right: STATION_CARD_CLEARANCE_PX };

export function DesktopMapPage() {
  const location = useMapLocation();
  const { number } = useSelectedStation();
  // The card unmounts on close, so the focus goes back to the row it was opened from.
  const panelRef = useListFocusReturn(number);
  const { focusSelected, focusSelection, locate } = useUserFocus(number, location.locate);
  // The browser would not ask a denied permission again, so the map only keeps its zoom.
  const controls = {
    onRecenter: location.isLocationDenied ? undefined : locate,
    isRecentering: location.status === 'pending',
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader />
      <OfflineBar center={location.center} />
      <main className="flex min-h-0 flex-1">
        <SidePanel ref={panelRef} label="Estaciones" className="p-4">
          <DesktopPanel location={{ ...location, locate }} />
        </SidePanel>
        <div className="relative min-w-0 flex-1">
          <StationsMap
            layout="desktop"
            label="Mapa de estaciones"
            center={location.mapCenter}
            userLocation={location.userLocation}
            focusPadding={CARD_COVERED_MAP}
            focusSelected={focusSelected}
            onSelect={focusSelection}
            controls={controls}
            className="h-full w-full"
          />
          <StationCard center={location.center} />
        </div>
      </main>
    </div>
  );
}
