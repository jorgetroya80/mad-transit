import type { Ref } from 'react';
import type { Coordinates, Station } from '@/entities/station';
import { FavoriteButton } from '@/features/toggle-favorite';
import { ArrowLeftIcon } from '@/shared/ui';
import { StationMeta } from './StationMeta';

type SheetCardHeaderProps = {
  number: string;
  // Undefined while loading, when not found and on error: the heading falls back to the number.
  station: Station | undefined;
  center: Coordinates | undefined;
  onBack: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
};

// One row, so it fits the sheet at peek: the arrow back, the meta above the name, the star.
// The name takes programmatic focus (`tabIndex={-1}`, no tab stop) when the page moves it there.
export function SheetCardHeader({
  number,
  station,
  center,
  onBack,
  headingRef,
}: SheetCardHeaderProps) {
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
        {station ? <StationMeta number={station.number} center={center} /> : null}
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg leading-tight font-bold break-words text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {station?.name ?? `Estación ${number}`}
        </h2>
      </div>
      {station ? <FavoriteButton number={station.number} variant="icon" className="-mr-2" /> : null}
    </div>
  );
}
