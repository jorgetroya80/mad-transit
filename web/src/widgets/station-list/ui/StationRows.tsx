import {
  type DataStatus,
  isSameStationNumber,
  type Need,
  type Station,
  StationRow,
} from '@/entities/station';

type StationRowsProps = {
  stations: readonly Station[];
  need: Need;
  // Status of the list the stations come from: it greys every row out when unconfirmed.
  status: DataStatus;
  // `?station`: its rows are marked in every section that lists it.
  selectedNumber: string | undefined;
  onSelect: (number: string) => void;
};

// `data-station-number` lets the page return the focus to the row a detail was opened from.
export function StationRows({
  stations,
  need,
  status,
  selectedNumber,
  onSelect,
}: StationRowsProps) {
  return (
    <ul className="divide-y divide-line">
      {stations.map((station) => (
        <li key={station.number}>
          <StationRow
            station={station}
            need={need}
            status={status}
            selected={isSameStationNumber(station.number, selectedNumber)}
            data-station-number={station.number}
            onClick={() => onSelect(station.number)}
          />
        </li>
      ))}
    </ul>
  );
}
