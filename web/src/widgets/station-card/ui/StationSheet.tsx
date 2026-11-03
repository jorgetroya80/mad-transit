import { type Coordinates, useStationDetail } from '@/entities/station';
import { useSelectedStation } from '@/features/select-station';
import { UpdatedAt } from '@/shared/ui';
import { useCloseOnEscape } from '../model/useCloseOnEscape';
import { CardBody } from './CardBody';
import { SheetCardHeader } from './SheetCardHeader';

// The station card inside the mobile sheet, in two pieces: the header row goes in the sheet's
// header, visible at peek, and the rest in its body. Both read the same cached detail, and
// both go back to the list on Escape. Opening leaves the focus where it was.

type StationSheetHeaderProps = {
  number: string;
  // Center of the nearby list: the distance is read from it. Undefined hides the distance.
  center: Coordinates | undefined;
};

export function StationSheetHeader({ number, center }: StationSheetHeaderProps) {
  const detail = useStationDetail(number);
  const { clear } = useSelectedStation();
  const escapeRef = useCloseOnEscape(clear);
  const station = detail.status === 'not-found' ? undefined : detail.station;

  return (
    <div ref={escapeRef} className="px-4 pb-3">
      <SheetCardHeader number={number} station={station} center={center} onBack={clear} />
    </div>
  );
}

type StationSheetBodyProps = { number: string };

// The age is the detail's own, or the full list's when the detail falls back to it.
export function StationSheetBody({ number }: StationSheetBodyProps) {
  const detail = useStationDetail(number);
  const { clear } = useSelectedStation();
  const escapeRef = useCloseOnEscape(clear);
  const updatedAt = detail.status !== 'not-found' && detail.station ? detail.updatedAt : undefined;

  return (
    <div ref={escapeRef} className="flex flex-col gap-3">
      <CardBody detail={detail} />
      {updatedAt ? <UpdatedAt date={updatedAt} /> : null}
    </div>
  );
}
