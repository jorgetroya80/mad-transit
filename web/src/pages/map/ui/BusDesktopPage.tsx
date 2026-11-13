import { ServiceToggle } from '@/features/select-service';
import { useSelectedStop } from '@/features/select-stop';
import { useMapLocation, useUserFocus } from '@/shared/lib';
import { SidePanel } from '@/shared/ui';
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
    <main className="flex h-dvh overflow-hidden">
      <h1 className="sr-only">Mad Transit</h1>
      <SidePanel label="Paradas" className="p-4">
        <div className="flex min-h-full flex-col gap-4">
          <ServiceToggle />
          <h2 className="text-lg font-semibold text-fg">Paradas</h2>
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
  );
}
