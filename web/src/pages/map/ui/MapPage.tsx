import { useService } from '@/features/select-service';
import { MD_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib';
import { BusPage } from './BusPage';
import { DesktopMapPage } from './DesktopMapPage';
import { MobileMapPage } from './MobileMapPage';

// Two compositions over the same URL state (`?station`, `?need`): crossing md remounts the page.
// Bus has its own until its stops map and list arrive.
export function MapPage() {
  const isWideViewport = useMediaQuery(MD_MEDIA_QUERY);
  const [service] = useService();
  if (service === 'bus') return <BusPage />;
  return isWideViewport ? <DesktopMapPage /> : <MobileMapPage />;
}
