import { type Ref, useId } from 'react';
import { type Coordinates, useStationDetail } from '@/entities/station';
import { useSelectedStation } from '@/features/select-station';
import { FavoriteButton } from '@/features/toggle-favorite';
import { Card, DataAttribution, IconButton } from '@/shared/ui';
import { cardHeading } from '../model/cardHeading';
import { useStationMeta } from '../model/useStationMeta';
import { useCloseOnEscape } from '@/shared/lib';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';

// The station card inside the mobile sheet, in two pieces: the header row goes in the sheet's
// header and the rest in its body, since the sheet decides what goes in each slot. Both read the same cached detail, and
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
  const titleId = useId();
  const heading = cardHeading(number, detail);
  const meta = useStationMeta(heading, center);

  return (
    <div className="pb-3">
      <Card as="div" elevation="flat" titleId={titleId} onEscape={clear}>
        <Card.Header
          titleId={titleId}
          title={heading.title}
          meta={meta}
          titleRef={headingRef}
          leadingAction={
            <IconButton
              label="Volver a la lista"
              icon="chevron-left"
              iconSize={22}
              iconTone="primary"
              onClick={clear}
            />
          }
          titleAction={heading.station ? <FavoriteButton number={heading.station.number} /> : null}
        />
      </Card>
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

  return (
    <div ref={escapeRef} className="flex min-h-full flex-col gap-3">
      <CardBody number={number} detail={detail} onClose={clear} />
      <CardFooter detail={detail} />
      <footer className="mt-auto">
        <DataAttribution />
      </footer>
    </div>
  );
}
