import type { Coordinates } from '@/entities/station';
import { SearchByNumber, type SearchVariant } from '@/features/search-by-number';
import { useBicimadSource } from '../model/useBicimadSource';

type TransitSearchProps = {
  // Where the nearby list is, so a search without results can suggest its nearest station.
  center: Coordinates | undefined;
  variant?: SearchVariant;
};

// Each transport mode adds its own source here; with two or more, the search shows a picker.
export function TransitSearch({ center, variant }: TransitSearchProps) {
  const bicimad = useBicimadSource(center);
  return <SearchByNumber sources={[bicimad]} variant={variant} />;
}
