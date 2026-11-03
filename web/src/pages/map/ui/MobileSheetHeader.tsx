import type { Need } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { NOW_TICK_MS } from '@/shared/config';
import { useNow } from '@/shared/lib';
import { ChevronIcon, RelativeTime, type SheetSnap } from '@/shared/ui';
import { useNearbyAvailability } from '@/widgets/station-list';
import type { MapLocation } from '../model/useMapLocation';

type MobileSheetHeaderProps = {
  location: MapLocation;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  // The sheet body, which «Ver todas» and «Ver mapa» resize.
  bodyId: string;
};

const NEED_NOUN = { bikes: 'bicis', docks: 'hueco' } as const satisfies Record<Need, string>;

// Without data there is nothing to count yet, so the title only says what the list is.
function availabilityTitle(count: number | undefined, need: Need): string {
  if (count === undefined) return 'Estaciones cercanas';
  return `${count} ${count === 1 ? 'estación' : 'estaciones'} con ${NEED_NOUN[need]}`;
}

export function MobileSheetHeader({
  location,
  snap,
  onSnapChange,
  bodyId,
}: MobileSheetHeaderProps) {
  const [need] = useNeed();
  const { count, updatedAt } = useNearbyAvailability(location.center, need);
  const now = useNow(NOW_TICK_MS);

  return (
    <div className="flex items-center gap-3 px-4 pb-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-sheet-title font-bold text-fg">{availabilityTitle(count, need)}</h2>
        <p className="text-sheet-subtitle text-fg-muted">
          {location.isApproximateLocation ? 'Cerca de la Puerta del Sol' : 'Cerca de ti'}
          {updatedAt ? (
            <>
              {' · '}
              <RelativeTime date={updatedAt} now={now} />
            </>
          ) : null}
        </p>
      </div>
      <SnapButton snap={snap} onSnapChange={onSnapChange} bodyId={bodyId} />
    </div>
  );
}

type SnapButtonProps = Omit<MobileSheetHeaderProps, 'location'>;

// Full shows the whole list, so the way back is to the map (peek), not to half. The chevron
// points up to open and down to close, as in the design.
function SnapButton({ snap, onSnapChange, bodyId }: SnapButtonProps) {
  const isFull = snap === 'full';
  return (
    <button
      type="button"
      aria-controls={bodyId}
      onClick={() => onSnapChange(isFull ? 'peek' : 'full')}
      className="flex min-h-11 min-w-11 shrink-0 items-center gap-1 rounded-control px-2 text-sm font-semibold text-primary hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {isFull ? 'Ver mapa' : 'Ver todas'}
      <ChevronIcon
        className={`size-4 transition-transform duration-320 ease-sheet motion-reduce:transition-none ${isFull ? '' : 'rotate-180'}`}
      />
    </button>
  );
}
