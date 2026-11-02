import { SidePanel } from '@/shared/ui';
import { AppHeader } from '@/widgets/app-header';
import { StationsMap } from '@/widgets/stations-map';
import { useMapLocation } from '../model/useMapLocation';
import { DesktopPanel } from './DesktopPanel';

// The station card (320 px wide, 16 px from each side) covers the right of the map; the side
// panel sits beside it and covers nothing.
const STATION_CARD_CLEARANCE_PX = 352;
const CARD_COVERED_MAP = { bottom: 0, right: STATION_CARD_CLEARANCE_PX };

export function DesktopMapPage() {
  const location = useMapLocation();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader />
      <main className="flex min-h-0 flex-1">
        <SidePanel label="Estaciones" className="p-4">
          <DesktopPanel location={location} />
        </SidePanel>
        <div className="relative min-w-0 flex-1">
          <StationsMap
            label="Mapa de estaciones"
            center={location.mapCenter}
            userLocation={location.userLocation}
            focusPadding={CARD_COVERED_MAP}
            className="h-full w-full"
          />
        </div>
      </main>
    </div>
  );
}
