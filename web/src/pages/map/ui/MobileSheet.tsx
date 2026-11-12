import type { Ref } from 'react';
import type { MapLocation } from '@/shared/lib';
import { BottomSheet } from '@/shared/ui';
import { StationSheetBody, StationSheetHeader } from '@/widgets/station-card';
import type { useSheetSnap } from '../model/useSheetSnap';
import { MobilePanel } from './MobilePanel';
import { MobileSheetHeader } from './MobileSheetHeader';
import { DetailStripLabel, ListStripLabel } from './SheetStripLabel';

type MobileSheetProps = {
  sheet: ReturnType<typeof useSheetSnap>;
  // Where the page puts the focus that would be lost: see useListFocusReturn.
  panelRef: Ref<HTMLDivElement>;
  handleRef: Ref<HTMLButtonElement>;
  detailHeadingRef: Ref<HTMLHeadingElement>;
  location: MapLocation;
  selectedStation: string | undefined;
};

// The list, or the selected station in its place. Hidden, the sheet keeps only a strip naming
// what it holds.
export function MobileSheet({
  sheet,
  panelRef,
  handleRef,
  detailHeadingRef,
  location,
  selectedStation,
}: MobileSheetProps) {
  const isStationOpen = selectedStation !== undefined;
  return (
    <BottomSheet
      label={isStationOpen ? 'Detalle de la estación' : 'Estaciones'}
      snap={sheet.snap}
      onSnapChange={sheet.setSnap}
      hideLabel={sheet.hideLabel}
      collapsedLabel={
        isStationOpen ? (
          <DetailStripLabel number={selectedStation} />
        ) : (
          <ListStripLabel center={location.center} />
        )
      }
      handleRef={handleRef}
      header={
        isStationOpen ? (
          <StationSheetHeader
            number={selectedStation}
            center={location.center}
            headingRef={detailHeadingRef}
          />
        ) : (
          <MobileSheetHeader location={location} />
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
