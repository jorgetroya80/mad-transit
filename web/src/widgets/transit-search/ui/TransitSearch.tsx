import { SearchByNumber, type SearchVariant } from '@/features/search-by-number';
import { useBicimadSource } from '../model/useBicimadSource';

type TransitSearchProps = { variant?: SearchVariant };

// Each transport mode adds its own source here; with two or more, the search shows a picker.
export function TransitSearch({ variant }: TransitSearchProps) {
  const bicimad = useBicimadSource();
  return <SearchByNumber sources={[bicimad]} variant={variant} />;
}
