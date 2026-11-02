import { MD_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib';
import { DesktopMapPage } from './DesktopMapPage';
import { MobileMapPage } from './MobileMapPage';

// Two compositions over the same URL state (`?station`, `?need`): crossing md remounts the page.
export function MapPage() {
  const isWideViewport = useMediaQuery(MD_MEDIA_QUERY);
  return isWideViewport ? <DesktopMapPage /> : <MobileMapPage />;
}
