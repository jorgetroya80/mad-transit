import type { ComponentProps } from 'react';
import { availabilityFor } from '../model/availability';
import type { DataStatus, Need, Station } from '../model/types';
import { AvailabilityBadge } from './AvailabilityBadge';
import { availabilityText } from './availabilityText';
import { formatDistance, formatSpokenDistance } from './formatDistance';
import { formatSpokenWalk, formatWalk } from './formatWalk';

type RowStation = Pick<
  Station,
  'number' | 'name' | 'status' | 'bikes' | 'freeDocks' | 'distanceMeters'
>;

// Wraps a native button (forwards its props, `ref` included); the content and the
// accessible name come from the station.
type StationRowProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  station: RowStation;
  need: Need;
  status: DataStatus;
  // The station open in the URL.
  selected?: boolean;
};

// Hover skips `bg-chip`, which would hide the number chip. The ring is inset, so selecting a row
// does not change its size.
const ROW_STATE = {
  selected: 'bg-primary-soft ring-2 ring-inset ring-primary',
  idle: 'hover:bg-canvas',
} as const;

function nameRow(station: RowStation, availability: string): string {
  const meters = station.distanceMeters;
  const walk = meters === undefined ? [] : [formatSpokenDistance(meters), formatSpokenWalk(meters)];
  return [`Estación ${station.number}`, station.name, ...walk, availability].join(', ');
}

export function StationRow({
  station,
  need,
  status,
  selected = false,
  className = '',
  ...props
}: StationRowProps) {
  const { level, count } = availabilityFor(station, need, status);
  const meters = station.distanceMeters;

  return (
    <button
      type="button"
      {...props}
      aria-label={nameRow(station, availabilityText(level, count, need))}
      aria-current={selected || undefined}
      className={`flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left ${ROW_STATE[selected ? 'selected' : 'idle']} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      <span className="inline-flex h-8 min-w-10 shrink-0 items-center justify-center rounded-chip bg-chip px-1.5 text-sm font-semibold text-fg tabular-nums">
        {station.number}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="break-words text-fg">{station.name}</span>
        {meters === undefined ? null : (
          <span className="text-sm text-fg-muted">{`${formatDistance(meters)} · ${formatWalk(meters)}`}</span>
        )}
      </span>
      <AvailabilityBadge level={level} count={count} need={need} decorative />
    </button>
  );
}
