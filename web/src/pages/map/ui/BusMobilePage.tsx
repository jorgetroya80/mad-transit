import { ServiceToggle } from '@/features/select-service';
import { useSelectedStop } from '@/features/select-stop';
import { type GeoPosition, useMapLocation, useUserFocus } from '@/shared/lib';
import { BottomSheet } from '@/shared/ui';
import { BusStopsMap } from '@/widgets/bus-stops-map';
import { TransitSearch } from '@/widgets/transit-search';
import { useMapFocusPadding } from '../model/useMapFocusPadding';
import { useShownArrival } from '../model/useShownArrival';
import { useSheetSnap } from '../model/useSheetSnap';
import { BusPanel } from './BusPanel';
import { RecenterButton } from './RecenterButton';

// Full-screen map with the service choice floating on top, and the list in the bottom sheet.
// The sheet opens at half when a stop arrives in the URL, as the station detail does.
export function BusMobilePage() {
  const location = useMapLocation();
  const { number } = useSelectedStop();
  const { shownArrival, toggleOnMap } = useShownArrival(number);
  const sheet = useSheetSnap(number);
  const focusPadding = useMapFocusPadding(sheet.snap);
  const { focusSelected, focusSelection, locate } = useUserFocus(number, location.locate);

  return (
    <main className="relative grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <h1 className="sr-only">Mad Transit</h1>
      <FloatingControls center={location.center} />
      {location.isLocationDenied ? null : (
        <RecenterButton
          snap={sheet.snap}
          isRecentering={location.status === 'pending'}
          onRecenter={locate}
          className="col-start-1 row-start-1 row-end-2"
        />
      )}
      <BottomSheet
        label="Paradas"
        snap={sheet.snap}
        onSnapChange={sheet.setSnap}
        hideLabel="Ocultar lista"
        collapsedLabel="Mostrar paradas cercanas"
      >
        <BusPanel
          number={number}
          location={location}
          layout="mobile"
          shownArrival={shownArrival}
          onToggleOnMap={toggleOnMap}
        />
      </BottomSheet>
      <BusStopsMap
        className="col-start-1 row-start-1 h-full w-full"
        label="Mapa de paradas"
        center={location.center}
        mapCenter={location.mapCenter}
        userLocation={location.userLocation}
        focusPadding={focusPadding}
        focusSelected={focusSelected}
        onSelect={focusSelection}
        shownArrival={shownArrival}
      />
    </main>
  );
}

// Service and stop search, over the top of the map.
function FloatingControls({ center }: { center: GeoPosition | undefined }) {
  return (
    <div className="absolute inset-x-4 top-11 z-20 flex flex-col gap-2.5">
      <ServiceToggle />
      <TransitSearch center={center} variant="floating" />
    </div>
  );
}
