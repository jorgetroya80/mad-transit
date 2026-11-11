import type { Need } from '@/entities/station';
import { FAVORITES_OPEN_STORAGE_KEY } from '@/shared/config';
import { useLocalStorage } from '@/shared/lib';
import { Disclosure } from '@/shared/ui';
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

function parseOpen(raw: unknown): boolean | undefined {
  return typeof raw === 'boolean' ? raw : undefined;
}

export function FavoriteStations({
  need,
  selectedNumber,
  onSelect,
  isCollapsible,
  level = 2,
}: FavoriteStationsProps) {
  const { stations, status } = useFavoriteStations();
  // Kept here, not in the disclosure, so the fold survives a reload.
  const [isOpen, setOpen] = useLocalStorage(FAVORITES_OPEN_STORAGE_KEY, parseOpen, true);

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
      <Disclosure
        open={isOpen}
        onOpenChange={setOpen}
        title="Favoritas"
        count={String(stations.length)}
        icon="star-filled"
        headingLevel={level}
      >
        {rows}
      </Disclosure>
    </div>
  );
}
