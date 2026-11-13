import type { BusStop } from '@/entities/bus-stop';
import { formatDistance, formatSpokenDistance } from '@/entities/station';
import { ListItem, Tag } from '@/shared/ui';

type BusStopRowsProps = {
  stops: readonly BusStop[];
  // `?stop`: its row is marked.
  selectedNumber: string | undefined;
  onSelect: (number: string) => void;
};

function rowLabel({ number, name, lines, distanceMeters }: BusStop): string {
  const distance = distanceMeters === undefined ? [] : [formatSpokenDistance(distanceMeters)];
  return [`Parada ${number}`, name, ...distance, `Líneas ${lines.join(', ')}`].join(', ');
}

function LineTags({ lines }: { lines: readonly string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {lines.map((line) => (
        <Tag key={line} label={line} />
      ))}
    </span>
  );
}

export function BusStopRows({ stops, selectedNumber, onSelect }: BusStopRowsProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {stops.map((stop) => (
        <li key={stop.number}>
          <ListItem
            title={stop.name}
            leadingText={stop.number}
            subtitle={
              stop.distanceMeters === undefined ? undefined : formatDistance(stop.distanceMeters)
            }
            below={<LineTags lines={stop.lines} />}
            selected={stop.number === selectedNumber}
            accessibleLabel={rowLabel(stop)}
            onSelect={() => onSelect(stop.number)}
          />
        </li>
      ))}
    </ul>
  );
}
