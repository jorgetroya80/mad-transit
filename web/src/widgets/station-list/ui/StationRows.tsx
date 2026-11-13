import {
  availabilityFor,
  availabilityLabel,
  availabilityStatusText,
  availabilityText,
  availabilityTone,
  formatDistance,
  formatSpokenDistance,
  formatSpokenWalk,
  formatWalk,
  isSameStationNumber,
  type Need,
  type Station,
} from '@/entities/station';
import { CountBadge, ListItem } from '@/shared/ui';
import { type DataStatus } from '@/shared/lib';

type StationRowsProps = {
  stations: readonly Station[];
  need: Need;
  // Status of the list the stations come from: it greys every row out when unconfirmed.
  status: DataStatus;
  // `?station`: its rows are marked in every section that lists it.
  selectedNumber: string | undefined;
  onSelect: (number: string) => void;
};

function rowLabel(station: Station, availability: string): string {
  const meters = station.distanceMeters;
  const walk = meters === undefined ? [] : [formatSpokenDistance(meters), formatSpokenWalk(meters)];
  return [`Estación ${station.number}`, station.name, ...walk, availability].join(', ');
}

function rowSubtitle(meters: number | undefined): string | undefined {
  return meters === undefined ? undefined : `${formatDistance(meters)} · ${formatWalk(meters)}`;
}

type RowProps = Omit<StationRowsProps, 'stations' | 'selectedNumber'> & {
  station: Station;
  selected: boolean;
};

// The badge has no srText: the row's label already says the count.
function Row({ station, need, status, selected, onSelect }: RowProps) {
  const availability = availabilityFor(station, need, status);
  const { level, count } = availability;
  const tone = availabilityTone(level);
  return (
    <ListItem
      title={station.name}
      leadingText={station.number}
      subtitle={rowSubtitle(station.distanceMeters)}
      trailing={<CountBadge value={availabilityLabel(availability)} tone={tone} />}
      trailingCaption={{ text: availabilityStatusText(level, need), tone }}
      selected={selected}
      accessibleLabel={rowLabel(station, availabilityText(level, count, need))}
      onSelect={() => onSelect(station.number)}
    />
  );
}

// `data-station-number` lets the page return the focus to the row a detail was opened from.
export function StationRows({ stations, selectedNumber, ...rowProps }: StationRowsProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {stations.map((station) => (
        <li key={station.number} data-station-number={station.number}>
          <Row
            {...rowProps}
            station={station}
            selected={isSameStationNumber(station.number, selectedNumber)}
          />
        </li>
      ))}
    </ul>
  );
}
