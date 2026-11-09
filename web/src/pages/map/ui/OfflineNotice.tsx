import type { Coordinates } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { StatusBanner } from '@/shared/ui';
import { useNearbyAvailability } from '@/widgets/station-list';

type OfflineNoticeProps = { center: Coordinates | undefined };

// Only with the saved list on screen: without it, the list's own block is the one alert.
function useIsSavedList(center: Coordinates | undefined): boolean {
  const [need] = useNeed();
  return useNearbyAvailability(center, need).isSaved;
}

// Under the app header, across the whole page.
export function OfflineBar({ center }: OfflineNoticeProps) {
  if (!useIsSavedList(center)) return null;
  return (
    <StatusBanner variant="offline" shape="bar">
      <strong>Sin conexión a internet.</strong> Mostramos los últimos datos guardados; se
      actualizará solo al volver a conectarte.
    </StatusBanner>
  );
}

// Under the floating mode, over the map.
export function OfflineBanner({ center }: OfflineNoticeProps) {
  if (!useIsSavedList(center)) return null;
  return (
    <StatusBanner variant="offline">
      <strong>Sin conexión a internet.</strong> Se actualizará solo al volver a conectarte.
    </StatusBanner>
  );
}
