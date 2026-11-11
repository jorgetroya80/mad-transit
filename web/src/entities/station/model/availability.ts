import { LOW_AVAILABILITY_THRESHOLD } from '@/shared/config';
import type { Tone } from '@/shared/ui';
import type { AvailabilityLevel, DataStatus, Need, Station } from './types';

type Availability = { level: AvailabilityLevel; count: number };

export function availabilityFor(
  station: Pick<Station, 'status' | 'bikes' | 'freeDocks'>,
  need: Need,
  status: DataStatus,
): Availability {
  const count = need === 'bikes' ? station.bikes : station.freeDocks;
  // Unconfirmed data greys everything out, out of service included: none of it may be true now.
  if (status === 'stale' || status === 'offline') return { level: 'unconfirmed', count };
  if (station.status === 'NO_SERVICE') return { level: 'off', count };
  if (count === 0) return { level: 'empty', count };
  if (count < LOW_AVAILABILITY_THRESHOLD) return { level: 'low', count };
  return { level: 'good', count };
}

const OFF_LABEL = '–';

// The visible number of a station, shared by the list badge and the map point. An off
// station's count is meaningless, so it shows a dash.
export function availabilityLabel({ level, count }: Availability): string {
  return level === 'off' ? OFF_LABEL : String(count);
}

// Inverse is a surface, not a level, so no level may take it.
type AvailabilityTone = Exclude<Tone, 'inverse'>;

const AVAILABILITY_TONES = {
  good: 'success',
  low: 'warning',
  empty: 'danger',
  off: 'neutral',
  unconfirmed: 'muted',
} as const satisfies Record<AvailabilityLevel, AvailabilityTone>;

export function availabilityTone(level: AvailabilityLevel): AvailabilityTone {
  return AVAILABILITY_TONES[level];
}
