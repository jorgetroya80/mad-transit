import { availabilityLabel } from '../model/availability';
import type { AvailabilityLevel, Need } from '../model/types';
import { availabilityStatusText } from './availabilityStatusText';
import { availabilityCountText } from './availabilityText';

type AvailabilityBadgeProps = {
  level: AvailabilityLevel;
  count: number;
  need: Need;
  decorative?: boolean;
};

// Full class names (not built from `level`) so Tailwind finds them in the source. The pill has a
// fixed size, so the dashed border of `empty` does not change it.
const TONES = {
  good: {
    pill: 'bg-availability-good text-availability-good-foreground',
    label: 'text-availability-good-label',
  },
  low: {
    pill: 'bg-availability-low text-availability-low-foreground',
    label: 'text-availability-low-label',
  },
  empty: {
    pill: 'bg-availability-empty text-availability-empty-foreground border-2 border-dashed border-availability-empty-line',
    label: 'text-availability-empty-label',
  },
  off: {
    pill: 'bg-availability-off text-availability-off-foreground',
    label: 'text-availability-off-label',
  },
  unconfirmed: {
    pill: 'bg-availability-unconfirmed text-availability-unconfirmed-foreground',
    label: 'text-availability-unconfirmed-label',
  },
} as const satisfies Record<AvailabilityLevel, { pill: string; label: string }>;

function spokenText(level: AvailabilityLevel, count: number, need: Need) {
  const status = availabilityStatusText(level, need);
  return level === 'off' ? status : `${availabilityCountText(count, need)}, ${status}`;
}

// Color is never the only cue: the pill shows the number (or a dash when off) with its status
// below. Screen readers get the full text, unless a row already says it (`decorative`).
export function AvailabilityBadge({
  level,
  count,
  need,
  decorative = false,
}: AvailabilityBadgeProps) {
  const tone = TONES[level];
  return (
    <span
      aria-hidden={decorative || undefined}
      className="inline-flex shrink-0 flex-col items-end gap-0.5"
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-7.5 w-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums md:h-8 md:w-11 ${tone.pill}`}
      >
        {availabilityLabel({ level, count })}
      </span>
      <span aria-hidden="true" className={`text-right text-xs font-medium ${tone.label}`}>
        {availabilityStatusText(level, need)}
      </span>
      {decorative ? null : <span className="sr-only">{spokenText(level, count, need)}</span>}
    </span>
  );
}
