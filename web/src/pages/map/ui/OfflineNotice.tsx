import type { Coordinates } from '@/entities/station';
import { useNeed } from '@/features/filter-by-need';
import { Banner } from '@/shared/ui';
import { useNearbyAvailability } from '@/widgets/station-list';

type OfflineNoticeProps = { center: Coordinates | undefined };

// Only with the saved list on screen: without it, the list's own block is the one alert.
function useIsSavedList(center: Coordinates | undefined): boolean {
  const [need] = useNeed();
  return useNearbyAvailability(center, need).isSaved;
}

const OFFLINE_TITLE = 'Sin conexión a internet.';

// Under the app header, across the whole page.
export function OfflineBar({ center }: OfflineNoticeProps) {
  if (!useIsSavedList(center)) return null;
  return (
    <Banner
      tone="inverse"
      icon="wifi-off"
      announce="assertive"
      layout="bar"
      title={OFFLINE_TITLE}
      message="Mostramos los últimos datos guardados; se actualizará solo al volver a conectarte."
    />
  );
}

// Under the floating mode, over the map.
export function OfflineBanner({ center }: OfflineNoticeProps) {
  if (!useIsSavedList(center)) return null;
  return (
    <Banner
      tone="inverse"
      icon="wifi-off"
      announce="assertive"
      title={OFFLINE_TITLE}
      message="Se actualizará solo al volver a conectarte."
    />
  );
}
