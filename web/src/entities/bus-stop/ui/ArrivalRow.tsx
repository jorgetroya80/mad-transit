import { Tag } from '@/shared/ui';
import { formatArrival } from '../model/formatArrival';
import type { Arrival } from '../model/types';

export function ArrivalRow({ arrival }: { arrival: Arrival }) {
  return (
    <li className="flex items-center gap-3 border-t border-line-subtle py-2.5">
      <Tag label={arrival.line} size="md" />
      <span className="min-w-0 flex-1 text-label break-words text-fg">{arrival.destination}</span>
      <span className="shrink-0 text-label tabular-nums text-fg">{formatArrival(arrival)}</span>
    </li>
  );
}
