import { useSelectedStop } from '@/features/select-stop';
import { NEARBY_RADIUS_M } from '@/shared/config';
import { type GeoPosition, usePendingAction } from '@/shared/lib';
import { Button, Spinner, StaleNotice, StatusText } from '@/shared/ui';
import { type NearbyStopList, useNearbyStopList } from '../model/useNearbyStopList';
import { BusStopRows } from './BusStopRows';
import { LocationNotice } from './LocationNotice';

type Layout = 'desktop' | 'mobile';

type BusStopListProps = {
  // Undefined while the location is still being resolved: the nearby stops wait for it.
  center: GeoPosition | undefined;
  // True when `center` is the Puerta del Sol fallback instead of the user's position.
  isApproximateLocation: boolean;
  isLocationDenied: boolean;
  layout: Layout;
  onLocate: () => void;
  isLocating: boolean;
};

const FAILURE_TEXT = 'No se pudieron cargar las paradas cercanas';
const MESSAGE_CLASSES = 'flex items-center gap-2 p-4 text-body text-fg-muted';

// Busy while the retry asks; disabled until a Retry-After has passed.
function ListFailure({ list }: { list: NearbyStopList }) {
  const { isPending, run } = usePendingAction(list.retry);
  return (
    <div className="flex flex-col items-start gap-3 p-4">
      <StatusText text={FAILURE_TEXT} tone="danger" live="polite" />
      <Button
        label="Reintentar"
        icon="refresh"
        onClick={run}
        busy={isPending}
        disabled={list.isRetryBlocked}
      />
    </div>
  );
}

type NearbyStopsProps = {
  list: NearbyStopList;
  selectedNumber: string | undefined;
  onSelect: (number: string) => void;
};

function NearbyStops({ list, selectedNumber, onSelect }: NearbyStopsProps) {
  const { stops } = list;
  if (stops === undefined) {
    if (list.isError) return <ListFailure list={list} />;
    return (
      <output aria-busy="true" className={MESSAGE_CLASSES}>
        <Spinner className="text-primary" />
        Cargando paradas cercanas…
      </output>
    );
  }
  if (stops.length === 0) {
    return <output className={MESSAGE_CLASSES}>{`Ninguna parada a ${NEARBY_RADIUS_M} m`}</output>;
  }
  return <BusStopRows stops={stops} selectedNumber={selectedNumber} onSelect={onSelect} />;
}

export function BusStopList({
  center,
  isApproximateLocation,
  isLocationDenied,
  layout,
  onLocate,
  isLocating,
}: BusStopListProps) {
  const list = useNearbyStopList(center);
  const { number, select } = useSelectedStop();

  return (
    <div className="flex flex-col gap-4">
      {center === undefined ? null : (
        <LocationNotice
          layout={layout}
          isApproximateLocation={isApproximateLocation}
          isLocationDenied={isLocationDenied}
          onLocate={onLocate}
          isLocating={isLocating}
        />
      )}
      {list.isStale ? (
        <StaleNotice layout={layout} updatedAt={list.updatedAt} onRetry={list.retry} />
      ) : null}
      <section aria-label="Paradas cercanas" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <h3 className="text-section text-fg">Paradas cercanas</h3>
          {layout === 'desktop' ? (
            <p className="text-meta text-fg-muted">Ordenadas por distancia</p>
          ) : null}
        </div>
        <NearbyStops list={list} selectedNumber={number} onSelect={select} />
      </section>
    </div>
  );
}
