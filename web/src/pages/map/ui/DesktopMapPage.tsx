import { SidePanel } from '@/shared/ui';
import { AppHeader } from '@/widgets/app-header';
import { StationsMap } from '@/widgets/stations-map';
import { useMapLocation } from '../model/useMapLocation';
import { DesktopPanel } from './DesktopPanel';

// The side panel sits beside the map, so nothing covers the bottom of it.
const NO_COVERED_MAP = { bottom: 0 };

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
            focusPadding={NO_COVERED_MAP}
            className="h-full w-full"
          />
        </div>
      </main>
    </div>
  );
}
