import { useNearbyStops } from '@/entities/bus-stop';

import { NOW_TICK_MS } from '@/shared/config';
import { type GeoPosition, freshnessOf, useNow, useDataStatus } from '@/shared/lib';
import { AppHeader as Header } from '@/shared/ui';

type BusAppHeaderProps = {
  // Undefined until the location is resolved: the nearby stops wait for it.
  center: GeoPosition | undefined;
};

// The freshness of the nearby stops, which the list and the map both come from.
export function BusAppHeader({ center }: BusAppHeaderProps) {
  const { status, updatedAt, retry } = useDataStatus(useNearbyStops(center));
  const now = useNow(NOW_TICK_MS);
  const freshness = freshnessOf(status, updatedAt, now);

  return (
    <Header
      title="Mad Transit"
      subtitle="Paradas y llegadas de la EMT en tiempo real"
      statusText={freshness.text}
      statusTone={freshness.tone}
      showRefresh={freshness.action !== undefined}
      refreshLabel={freshness.action}
      onRefresh={retry}
    />
  );
}
