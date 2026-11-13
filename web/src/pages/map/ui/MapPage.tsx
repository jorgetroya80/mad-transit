import { useService } from '@/features/select-service';
import { MD_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib';
import { BusDesktopPage } from './BusDesktopPage';
import { BusMobilePage } from './BusMobilePage';
import { DesktopMapPage } from './DesktopMapPage';
import { MobileMapPage } from './MobileMapPage';

// Two compositions per service over the same URL state (`?station`, `?stop`, `?need`): crossing md
// remounts the page.
export function MapPage() {
  const isWideViewport = useMediaQuery(MD_MEDIA_QUERY);
  const [service] = useService();
  if (service === 'bus') return isWideViewport ? <BusDesktopPage /> : <BusMobilePage />;
  return isWideViewport ? <DesktopMapPage /> : <MobileMapPage />;
}
