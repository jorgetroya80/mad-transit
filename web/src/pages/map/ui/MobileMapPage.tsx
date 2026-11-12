import { useRef } from 'react';
import type { Coordinates } from '@/entities/station';
import { NeedToggle } from '@/features/filter-by-need';
import { useSelectedStation } from '@/features/select-station';
import { StationsMap } from '@/widgets/stations-map';
import { TransitSearch } from '@/widgets/transit-search';
import { useListFocusReturn } from '../model/useListFocusReturn';
import { useMapFocusPadding } from '../model/useMapFocusPadding';
import { useMapLocation } from '../model/useMapLocation';
import { useSheetSnap } from '../model/useSheetSnap';
import { useUserFocus } from '../model/useUserFocus';
import { MobileSheet } from './MobileSheet';
import { OfflineBanner } from './OfflineNotice';
import { RecenterButton } from './RecenterButton';

// Full-screen map with the search and mode floating on top. The sheet's hidden strip takes the
// last grid row, so the map (and its attribution) ends above it. The map comes last in the DOM,
// so Tab reaches it after the sheet; the grid puts it back in the first row, under the floating
// controls, and also places the recenter button against that row. The controls start 44 px
// down, below MapLibre's compact attribution (top-right, 10 px down, about 24 px tall).
export function MobileMapPage() {
  const location = useMapLocation();
  const { number } = useSelectedStation();
  const sheet = useSheetSnap(number);
  const handleRef = useRef<HTMLButtonElement>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useListFocusReturn(number, {
    detailHeading: detailHeadingRef,
    listFallback: handleRef,
  });
  const focusPadding = useMapFocusPadding(sheet.snap);
  const { focusSelected, focusSelection, locate } = useUserFocus(number, location.locate);

  return (
    <main className="relative grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <h1 className="sr-only">Mad Transit</h1>
      <FloatingControls center={location.center} />
      {/* The browser would not ask a denied permission again, as on desktop. The map's row only:
          an absolutely placed item without a row end would span the hidden strip's row too. */}
      {location.isLocationDenied ? null : (
        <RecenterButton
          snap={sheet.snap}
          isRecentering={location.status === 'pending'}
          onRecenter={locate}
          className="col-start-1 row-start-1 row-end-2"
        />
      )}
      <MobileSheet
        sheet={sheet}
        panelRef={panelRef}
        handleRef={handleRef}
        detailHeadingRef={detailHeadingRef}
        location={{ ...location, locate }}
        selectedStation={number}
      />
      <StationsMap
        layout="mobile"
        center={location.mapCenter}
        userLocation={location.userLocation}
        focusPadding={focusPadding}
        focusSelected={focusSelected}
        onSelect={focusSelection}
        className="col-start-1 row-start-1 h-full w-full"
      />
    </main>
  );
}

// Search, mode and the offline banner, over the top of the map.
function FloatingControls({ center }: { center: Coordinates | undefined }) {
  return (
    <div className="absolute inset-x-4 top-11 z-20 flex flex-col gap-2.5">
      <TransitSearch center={center} variant="floating" />
      <div className="self-end">
        <NeedToggle variant="pill" />
      </div>
      <OfflineBanner center={center} />
    </div>
  );
}
