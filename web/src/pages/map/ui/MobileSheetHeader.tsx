import { useNeed } from '@/features/filter-by-need';
import { NOW_TICK_MS } from '@/shared/config';
import { formatClock, formatMinutesAgo, useNow } from '@/shared/lib';
import { RelativeTime } from '@/shared/ui';
import { savedListCaption, useCombinedDataStatus } from '@/widgets/station-list';
import type { MapLocation } from '../model/useMapLocation';
import { useNearbyTitle } from '../model/useNearbyTitle';

type MobileSheetHeaderProps = { location: MapLocation };

const SUBTITLE = 'text-sheet-subtitle';

export function MobileSheetHeader({ location }: MobileSheetHeaderProps) {
  const { title, updatedAt, isSaved } = useNearbyTitle(location.center);

  return (
    <div className="px-4 pb-3">
      <h2 className="text-sheet-title font-bold text-fg">{title}</h2>
      {isSaved ? (
        <p className={`${SUBTITLE} text-fg-muted`}>{savedListCaption(updatedAt)}</p>
      ) : (
        <LiveSubtitle location={location} updatedAt={updatedAt} />
      )}
    </div>
  );
}

type SubtitleProps = MobileSheetHeaderProps & { updatedAt: Date | undefined };

// Unconfirmed like the stale notice below it (either list), with the same older time.
function LiveSubtitle({ location, updatedAt }: SubtitleProps) {
  const [need] = useNeed();
  const panel = useCombinedDataStatus(location.center, need);
  const now = useNow(NOW_TICK_MS);
  if (panel.status === 'stale') {
    return (
      <p className={`${SUBTITLE} text-notice-stale-foreground`}>
        {panel.updatedAt
          ? `Última actualización: ${formatClock(panel.updatedAt)} · ${formatMinutesAgo(panel.updatedAt, now)}`
          : 'Datos sin confirmar'}
      </p>
    );
  }
  return (
    <p className={`${SUBTITLE} text-fg-muted`}>
      {location.isApproximateLocation ? 'Cerca de la Puerta del Sol' : 'Cerca de ti'}
      {updatedAt ? (
        <>
          {' · '}
          <RelativeTime date={updatedAt} now={now} />
        </>
      ) : null}
    </p>
  );
}
