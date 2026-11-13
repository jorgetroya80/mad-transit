import type { Coordinates } from '@/entities/station';
import { SearchByNumber, type SearchVariant } from '@/features/search-by-number';
import { useService } from '@/features/select-service';
import { useBicimadSource } from '../model/useBicimadSource';
import { useBusSource } from '../model/useBusSource';

type TransitSearchProps = {
  // Where the nearby list is, so a search without results can suggest its nearest station.
  center: Coordinates | undefined;
  variant?: SearchVariant;
};

// The search follows the chosen service, so it never offers two sources at once. Each source is
// only read while its service is chosen.
export function TransitSearch({ center, variant }: TransitSearchProps) {
  const [service] = useService();
  if (service === 'bus') return <BusSearch variant={variant} />;
  return <BicimadSearch center={center} variant={variant} />;
}

function BicimadSearch({ center, variant }: TransitSearchProps) {
  const bicimad = useBicimadSource(center);
  return <SearchByNumber sources={[bicimad]} variant={variant} />;
}

function BusSearch({ variant }: Pick<TransitSearchProps, 'variant'>) {
  const bus = useBusSource();
  return <SearchByNumber sources={[bus]} variant={variant} />;
}
