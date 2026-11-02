import type { Need } from '@/entities/station';
import { needCaption } from '../lib/needCaption';
import { useFavoriteStations } from '../model/useFavoriteStations';
import { StationRows } from './StationRows';
import { StationSection } from './StationSection';

type FavoriteStationsProps = {
  need: Need;
  selectedNumber: string | undefined;
  onSelect: (number: string) => void;
};

export function FavoriteStations({ need, selectedNumber, onSelect }: FavoriteStationsProps) {
  const { stations, status } = useFavoriteStations();

  if (stations.length === 0) return null;
  return (
    <StationSection section="favorites" heading="Favoritas" caption={needCaption(need)}>
      <StationRows
        stations={stations}
        need={need}
        status={status}
        selectedNumber={selectedNumber}
        onSelect={onSelect}
      />
    </StationSection>
  );
}
