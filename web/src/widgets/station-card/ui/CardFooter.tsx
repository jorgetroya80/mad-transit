import type { StationDetailState } from '@/entities/station';
import { NOW_TICK_MS } from '@/shared/config';
import { formatClock, formatMinutesAgo, useNow } from '@/shared/lib';
import { UpdatedAt } from '@/shared/ui';

type CardFooterProps = { detail: StationDetailState };

function LastData({ updatedAt }: { updatedAt: Date | undefined }) {
  const now = useNow(NOW_TICK_MS);
  return (
    <p className="text-body text-fg-muted">
      {updatedAt
        ? `Último dato: ${formatClock(updatedAt)} · ${formatMinutesAgo(updatedAt, now)}`
        : 'Datos sin confirmar'}
    </p>
  );
}

// How old the counts are; without a station (loading, not found, failed) there is nothing to date.
export function CardFooter({ detail }: CardFooterProps) {
  if (detail.status === 'not-found' || detail.station === undefined) return null;
  if (detail.status === 'stale' || detail.status === 'offline') {
    return <LastData updatedAt={detail.updatedAt} />;
  }
  return detail.updatedAt ? <UpdatedAt date={detail.updatedAt} /> : null;
}
