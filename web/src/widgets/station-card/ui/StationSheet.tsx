import type { Ref } from 'react';
import { type Coordinates, useStationDetail } from '@/entities/station';
import { useSelectedStation } from '@/features/select-station';
import { DataAttribution, UpdatedAt } from '@/shared/ui';
import { useCloseOnEscape } from '../model/useCloseOnEscape';
import { CardBody } from './CardBody';
import { SheetCardHeader } from './SheetCardHeader';

// The station card inside the mobile sheet, in two pieces: the header row goes in the sheet's
// header, visible at peek, and the rest in its body. Both read the same cached detail, and
// both go back to the list on Escape. The page decides whether opening moves the focus to the
// name, through `headingRef`.

type StationSheetHeaderProps = {
  number: string;
  // Center of the nearby list: the distance is read from it. Undefined hides the distance.
  center: Coordinates | undefined;
  headingRef?: Ref<HTMLHeadingElement>;
};

export function StationSheetHeader({ number, center, headingRef }: StationSheetHeaderProps) {
  const detail = useStationDetail(number);
  const { clear } = useSelectedStation();
  const escapeRef = useCloseOnEscape(clear);
  const station = detail.status === 'not-found' ? undefined : detail.station;

  return (
    <div ref={escapeRef} className="px-4 pb-3">
      <SheetCardHeader
        number={number}
        station={station}
        center={center}
        onBack={clear}
        headingRef={headingRef}
      />
    </div>
  );
}

type StationSheetBodyProps = { number: string };

// The age is the detail's own, or the full list's when the detail falls back to it. The list
// and its EMT attribution unmount while the detail is open, so the detail credits EMT itself.
export function StationSheetBody({ number }: StationSheetBodyProps) {
  const detail = useStationDetail(number);
  const { clear } = useSelectedStation();
  const escapeRef = useCloseOnEscape(clear);
  const updatedAt = detail.status !== 'not-found' && detail.station ? detail.updatedAt : undefined;

  return (
    <div ref={escapeRef} className="flex min-h-full flex-col gap-3">
      <CardBody detail={detail} />
      {updatedAt ? <UpdatedAt date={updatedAt} /> : null}
      <footer className="mt-auto">
        <DataAttribution />
      </footer>
    </div>
  );
}
