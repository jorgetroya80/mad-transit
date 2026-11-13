import type { BusLine } from '@/entities/bus-stop';

export type LineRow = {
  label: string;
  // Night lines (`N1`) cross midnight: the label says so in text, not only by its schedule.
  isNight: boolean;
  towards: string;
  schedule: string;
  frequency: string;
};

const NIGHT_PREFIX = 'N';

// Direction A goes towards headerA, B towards headerB.
function towardsOf({ direction, headerA, headerB }: BusLine): string {
  return direction === 'A' ? headerA : headerB;
}

function scheduleOf({ firstBus, lastBus }: BusLine): string {
  return firstBus && lastBus ? `${firstBus}–${lastBus}` : 'Sin horario';
}

function frequencyOf({ minFrequencyMinutes: min, maxFrequencyMinutes: max }: BusLine): string {
  if (min === null || max === null) return 'Sin datos';
  return min === max ? `${min} min` : `${min}–${max} min`;
}

export function toLineRows(lines: readonly BusLine[]): LineRow[] {
  return lines.map((line) => ({
    label: line.label,
    isNight: line.label.startsWith(NIGHT_PREFIX),
    towards: towardsOf(line),
    schedule: scheduleOf(line),
    frequency: frequencyOf(line),
  }));
}
