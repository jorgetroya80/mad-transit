import type { Ref } from 'react';
import type { Coordinates } from '@/entities/station';
import { FavoriteButton } from '@/features/toggle-favorite';
import { ArrowLeftIcon } from '@/shared/ui';
import type { CardHeading } from '../model/cardHeading';
import { StationMeta } from './StationMeta';

type SheetCardHeaderProps = {
  heading: CardHeading;
  center: Coordinates | undefined;
  onBack: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
};

// One row: the arrow back, the meta above the name, the star.
// The name takes programmatic focus (`tabIndex={-1}`, no tab stop) when the page moves it there.
export function SheetCardHeader({ heading, center, onBack, headingRef }: SheetCardHeaderProps) {
  const { title, metaNumber, station } = heading;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Volver a la lista"
        onClick={onBack}
        className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-control text-primary hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeftIcon className="size-6" />
      </button>
      <div className="min-w-0 flex-1">
        {metaNumber ? (
          <StationMeta number={metaNumber} center={station ? center : undefined} />
        ) : null}
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg leading-tight font-bold break-words text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {title}
        </h2>
      </div>
      {station ? <FavoriteButton number={station.number} variant="icon" className="-mr-2" /> : null}
    </div>
  );
}
