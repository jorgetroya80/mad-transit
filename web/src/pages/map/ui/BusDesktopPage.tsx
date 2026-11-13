import { ServiceToggle } from '@/features/select-service';
import { useSelectedStop } from '@/features/select-stop';
import { useMapLocation, useUserFocus } from '@/shared/lib';
import { SidePanel } from '@/shared/ui';
import { BusAppHeader } from '@/widgets/bus-app-header';
import { BusStopsMap } from '@/widgets/bus-stops-map';
import { TransitSearch } from '@/widgets/transit-search';
import { useShownArrival } from '../model/useShownArrival';
import { BusPanel } from './BusPanel';

// The stops map beside the panel, as the stations map is beside its own.
export function BusDesktopPage() {
  const location = useMapLocation();
  const { number } = useSelectedStop();
  const { shownArrival, toggleOnMap } = useShownArrival(number);
  const { focusSelected, focusSelection, locate } = useUserFocus(number, location.locate);
  // The browser would not ask a denied permission again, so the map only keeps its zoom.
  const controls = {
    onRecenter: location.isLocationDenied ? undefined : locate,
    isRecentering: location.status === 'pending',
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BusAppHeader center={location.center} />
      <main className="flex min-h-0 flex-1">
        <SidePanel label="Paradas" className="p-4">
          <div className="flex min-h-full flex-col gap-4">
            <ServiceToggle />
            <TransitSearch center={location.center} />
            <BusPanel
              number={number}
              location={location}
              layout="desktop"
              shownArrival={shownArrival}
              onToggleOnMap={toggleOnMap}
            />
          </div>
        </SidePanel>
        <div className="relative min-w-0 flex-1">
          <BusStopsMap
            className="h-full w-full"
            label="Mapa de paradas"
            center={location.center}
            mapCenter={location.mapCenter}
            userLocation={location.userLocation}
            focusSelected={focusSelected}
            onSelect={focusSelection}
            controls={controls}
            shownArrival={shownArrival}
          />
        </div>
      </main>
    </div>
  );
}
