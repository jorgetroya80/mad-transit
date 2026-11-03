import type { Need } from '@/entities/station';
import { FAVORITES_OPEN_STORAGE_KEY } from '@/shared/config';
import { CollapsibleSection, StarIcon } from '@/shared/ui';
import { needCaption } from '../lib/needCaption';
import { useFavoriteStations } from '../model/useFavoriteStations';
import { StationRows } from './StationRows';
import { StationSection } from './StationSection';

type FavoriteStationsProps = {
  need: Need;
  selectedNumber: string | undefined;
  onSelect: (number: string) => void;
  // On desktop and mobile the section folds, and the mode already says what the numbers count.
  isCollapsible: boolean;
  level?: 2 | 3;
};

export function FavoriteStations({
  need,
  selectedNumber,
  onSelect,
  isCollapsible,
  level = 2,
}: FavoriteStationsProps) {
  const { stations, status } = useFavoriteStations();

  if (stations.length === 0) return null;
  const rows = (
    <StationRows
      stations={stations}
      need={need}
      status={status}
      selectedNumber={selectedNumber}
      onSelect={onSelect}
    />
  );
  if (!isCollapsible) {
    return (
      <StationSection section="favorites" heading="Favoritas" caption={needCaption(need)}>
        {rows}
      </StationSection>
    );
  }
  // The wrapper carries the section tag the page uses to return the focus to a row.
  return (
    <div data-station-list="favorites">
      <CollapsibleSection
        title="Favoritas"
        count={stations.length}
        icon={StarIcon}
        storageKey={FAVORITES_OPEN_STORAGE_KEY}
        level={level}
      >
        {rows}
      </CollapsibleSection>
    </div>
  );
}
