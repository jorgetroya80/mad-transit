import { type Ref, useId } from 'react';
import { BottomSheet } from '@/shared/ui';
import { StationSheetBody, StationSheetHeader } from '@/widgets/station-card';
import type { MapLocation } from '../model/useMapLocation';
import type { useSheetSnap } from '../model/useSheetSnap';
import { MobilePanel } from './MobilePanel';
import { MobileSheetHeader } from './MobileSheetHeader';

type MobileSheetProps = {
  sheet: ReturnType<typeof useSheetSnap>;
  panelRef: Ref<HTMLDivElement>;
  location: MapLocation;
  selectedStation: string | undefined;
};

// The list, or the selected station in its place. Either way the header stays visible at peek.
export function MobileSheet({ sheet, panelRef, location, selectedStation }: MobileSheetProps) {
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
      header={
        isStationOpen ? (
          <StationSheetHeader number={selectedStation} center={location.center} />
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
