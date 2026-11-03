import { type Ref, useId } from 'react';
import { BottomSheet } from '@/shared/ui';
import { StationSheetBody, StationSheetHeader } from '@/widgets/station-card';
import type { MapLocation } from '../model/useMapLocation';
import type { useSheetSnap } from '../model/useSheetSnap';
import { MobilePanel } from './MobilePanel';
import { MobileSheetHeader } from './MobileSheetHeader';

type MobileSheetProps = {
  sheet: ReturnType<typeof useSheetSnap>;
  // Where the page puts the focus that would be lost: see useListFocusReturn.
  panelRef: Ref<HTMLDivElement>;
  handleRef: Ref<HTMLButtonElement>;
  detailHeadingRef: Ref<HTMLHeadingElement>;
  location: MapLocation;
  selectedStation: string | undefined;
};

// The list, or the selected station in its place. Either way the header stays visible at peek.
export function MobileSheet({
  sheet,
  panelRef,
  handleRef,
  detailHeadingRef,
  location,
  selectedStation,
}: MobileSheetProps) {
  const bodyId = useId();
  const isStationOpen = selectedStation !== undefined;
  return (
    <BottomSheet
      label={isStationOpen ? 'Detalle de la estación' : 'Estaciones'}
      snap={sheet.snap}
      onSnapChange={sheet.setSnap}
      nextSnap={sheet.nextSnap}
      handleLabel={sheet.handleLabel}
      bodyId={bodyId}
      handleRef={handleRef}
      header={
        isStationOpen ? (
          <StationSheetHeader
            number={selectedStation}
            center={location.center}
            headingRef={detailHeadingRef}
          />
        ) : (
          <MobileSheetHeader
            location={location}
            snap={sheet.snap}
            onSnapChange={sheet.setSnap}
            bodyId={bodyId}
          />
        )
      }
    >
      {isStationOpen ? (
        <StationSheetBody number={selectedStation} />
      ) : (
        <MobilePanel ref={panelRef} location={location} />
      )}
    </BottomSheet>
  );
}
