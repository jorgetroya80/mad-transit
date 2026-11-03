import { NOW_TICK_MS } from '@/shared/config';
import { useNow } from '@/shared/lib';
import { RelativeTime } from '@/shared/ui';
import type { MapLocation } from '../model/useMapLocation';
import { useNearbyTitle } from '../model/useNearbyTitle';

type MobileSheetHeaderProps = { location: MapLocation };

export function MobileSheetHeader({ location }: MobileSheetHeaderProps) {
  const { title, updatedAt } = useNearbyTitle(location.center);
  const now = useNow(NOW_TICK_MS);

  return (
    <div className="px-4 pb-3">
      <h2 className="text-sheet-title font-bold text-fg">{title}</h2>
      <p className="text-sheet-subtitle text-fg-muted">
        {location.isApproximateLocation ? 'Cerca de la Puerta del Sol' : 'Cerca de ti'}
        {updatedAt ? (
          <>
            {' · '}
            <RelativeTime date={updatedAt} now={now} />
          </>
        ) : null}
      </p>
    </div>
  );
}
