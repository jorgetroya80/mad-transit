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
import { RecenterButton } from './RecenterButton';

// Full-screen map with the search and mode floating on top. The sheet's peek strip takes the
// last row of the column, so the map (and its attribution) ends above it.
export function MobileMapPage() {
  const location = useMapLocation();
  const { number } = useSelectedStation();
  const sheet = useSheetSnap(number);
  const panelRef = useListFocusReturn(number);
  const focusPadding = useMapFocusPadding(sheet.snap);
  const { focusSelected, focusSelection, locate } = useUserFocus(number, location.locate);

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <h1 className="sr-only">Mad Transit</h1>
      <div className="relative min-h-0 min-w-0 flex-1">
        <div className="absolute inset-x-4 top-4 z-20 flex flex-col gap-2.5">
          <TransitSearch variant="floating" />
          <div className="self-end rounded-control shadow-float">
            <NeedToggle variant="pill" />
          </div>
        </div>
        <RecenterButton
          snap={sheet.snap}
          isRecentering={location.status === 'pending'}
          onRecenter={locate}
        />
        <StationsMap
          center={location.mapCenter}
          userLocation={location.userLocation}
          focusPadding={focusPadding}
          focusSelected={focusSelected}
          onSelect={focusSelection}
          className="h-full w-full"
        />
      </div>
      <MobileSheet
        sheet={sheet}
        panelRef={panelRef}
        location={{ ...location, locate }}
        selectedStation={number}
      />
    </main>
  );
}
