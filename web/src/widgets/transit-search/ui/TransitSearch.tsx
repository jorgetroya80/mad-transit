import type { Coordinates } from '@/entities/station';
import { SearchByNumber, type SearchVariant } from '@/features/search-by-number';
import { useService } from '@/features/select-service';
import { useBicimadSource } from '../model/useBicimadSource';

type TransitSearchProps = {
  // Where the nearby list is, so a search without results can suggest its nearest station.
  center: Coordinates | undefined;
  variant?: SearchVariant;
};

// The search follows the chosen service, so it never offers two sources at once. Bus has no
// source yet; BiciMAD's is only read while BiciMAD is chosen.
export function TransitSearch({ center, variant }: TransitSearchProps) {
  const [service] = useService();
  if (service === 'bus') return null;
  return <BicimadSearch center={center} variant={variant} />;
}

function BicimadSearch({ center, variant }: TransitSearchProps) {
  const bicimad = useBicimadSource(center);
  return <SearchByNumber sources={[bicimad]} variant={variant} />;
}
