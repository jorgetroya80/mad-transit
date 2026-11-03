import { type Ref, useId } from 'react';
import { BottomSheet } from '@/shared/ui';
import type { MapLocation } from '../model/useMapLocation';
import type { useSheetSnap } from '../model/useSheetSnap';
import { MobilePanel } from './MobilePanel';
import { MobileSheetHeader } from './MobileSheetHeader';

type MobileSheetProps = {
  sheet: ReturnType<typeof useSheetSnap>;
  panelRef: Ref<HTMLDivElement>;
  location: MapLocation;
  isStationOpen: boolean;
};

// The list header only: the station detail keeps today's content until it gets its own.
export function MobileSheet({ sheet, panelRef, location, isStationOpen }: MobileSheetProps) {
  const bodyId = useId();
  return (
    <BottomSheet
      label="Estaciones"
      snap={sheet.snap}
      onSnapChange={sheet.setSnap}
      nextSnap={sheet.nextSnap}
      handleLabel={sheet.handleLabel}
      bodyId={bodyId}
      header={
        isStationOpen ? undefined : (
          <MobileSheetHeader
            location={location}
            snap={sheet.snap}
            onSnapChange={sheet.setSnap}
            bodyId={bodyId}
          />
        )
      }
    >
      <MobilePanel ref={panelRef} location={location} isStationOpen={isStationOpen} />
    </BottomSheet>
  );
}
