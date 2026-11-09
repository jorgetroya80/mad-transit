import type { DataStatus } from '@/entities/station';
import { OfflineIcon } from '@/shared/ui';

export type MapLayout = 'desktop' | 'mobile';

type MapNoticeProps = { status: DataStatus; hasData: boolean; layout: MapLayout };

// On mobile the floating search and mode take the top of the map and the sheet its bottom
// half, so the notices sit just below the mode; offline, the layer's text also clears the
// offline banner under it.
const PLACEMENT = {
  desktop: { notice: 'top-4', layer: 'justify-center' },
  mobile: { notice: 'top-40', layer: 'justify-start pt-60' },
} as const satisfies Record<MapLayout, { notice: string; layer: string }>;

const LIST_HINT = {
  desktop: 'Puedes seguir consultando la lista de la izquierda.',
  mobile: 'Puedes seguir consultando la lista de abajo.',
} as const satisfies Record<MapLayout, string>;

// The list already alerts about the failure, so this notice is not live. The base map still
// works, so taps go through it.
function ServiceNotice({ layout }: { layout: MapLayout }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-4 z-10 flex justify-center ${PLACEMENT[layout].notice}`}
    >
      <p className="rounded-control bg-surface px-4 py-2 text-center text-sm text-fg shadow-float">
        Las estaciones aparecerán aquí cuando se recupere el servicio
      </p>
    </div>
  );
}

// Opaque over the map, which stays mounted underneath and comes back as it was. An <output> is a
// status region; it only takes phrasing content, hence the spans.
function OfflineLayer({ hasData, layout }: Omit<MapNoticeProps, 'status'>) {
  return (
    <output
      className={`absolute inset-0 z-10 flex flex-col items-center gap-3 bg-canvas px-6 text-center text-fg-muted ${PLACEMENT[layout].layer}`}
    >
      <OfflineIcon className="size-8" />
      <span className="font-medium text-fg">El mapa no se puede cargar sin conexión</span>
      {hasData ? <span className="text-sm">{LIST_HINT[layout]}</span> : null}
    </output>
  );
}

export function MapNotice({ status, hasData, layout }: MapNoticeProps) {
  if (status === 'offline') return <OfflineLayer hasData={hasData} layout={layout} />;
  // With data a failure reads as stale, not error: error always means an empty map.
  if (status === 'error') return <ServiceNotice layout={layout} />;
  return null;
}
