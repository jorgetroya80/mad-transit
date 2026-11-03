import { useAllStations, useDataStatus } from '@/entities/station';
import { UpdatedIndicator } from '@/shared/ui';

// The freshness of the whole list, which the map and the nearby list both come from.
export function AppHeader() {
  const { status, updatedAt, retry } = useDataStatus(useAllStations());

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4">
      <div>
        <h1 className="text-lg leading-tight font-semibold text-fg">Mad Transit</h1>
        <p className="text-sm text-fg-muted">BiciMAD en tiempo real</p>
      </div>
      <UpdatedIndicator status={status} updatedAt={updatedAt} onRetry={retry} />
    </header>
  );
}
