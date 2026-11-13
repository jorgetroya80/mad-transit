import { IconButton, Tag } from '@/shared/ui';
import { formatArrival } from '../model/formatArrival';
import type { Arrival } from '../model/types';

type ArrivalRowProps = {
  arrival: Arrival;
  shownOnMap?: boolean;
  // Given to show the bus on the map; without a position the arrival has no button.
  onToggleOnMap?: () => void;
};

export function ArrivalRow({ arrival, shownOnMap, onToggleOnMap }: ArrivalRowProps) {
  return (
    <li className="flex items-center gap-3 border-t border-line-subtle py-2.5">
      <Tag label={arrival.line} size="md" />
      <span className="min-w-0 flex-1 text-label break-words text-fg">{arrival.destination}</span>
      <span className="shrink-0 text-label tabular-nums text-fg">{formatArrival(arrival)}</span>
      {onToggleOnMap && arrival.busLat !== null ? (
        <IconButton
          label={`Ver en el mapa el autobús de la línea ${arrival.line}`}
          icon="pin"
          iconTone="primary"
          variant="outline"
          pressed={shownOnMap}
          onClick={onToggleOnMap}
        />
      ) : null}
    </li>
  );
}
