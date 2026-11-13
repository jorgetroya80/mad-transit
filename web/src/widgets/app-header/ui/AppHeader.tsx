import { useAllStations, useDataStatus } from '@/entities/station';
import { NOW_TICK_MS } from '@/shared/config';
import { freshnessOf, useNow } from '@/shared/lib';
import { AppHeader as Header } from '@/shared/ui';

// The freshness of the whole list, which the map and the nearby list both come from.
export function AppHeader() {
  const { status, updatedAt, retry } = useDataStatus(useAllStations());
  const now = useNow(NOW_TICK_MS);
  const freshness = freshnessOf(status, updatedAt, now);

  return (
    <Header
      title="Mad Transit"
      subtitle="BiciMAD en tiempo real"
      statusText={freshness.text}
      statusTone={freshness.tone}
      showRefresh={freshness.action !== undefined}
      refreshLabel={freshness.action}
      onRefresh={retry}
    />
  );
}
