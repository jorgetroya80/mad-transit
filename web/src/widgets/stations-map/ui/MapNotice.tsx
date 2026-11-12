import type { DataStatus } from '@/entities/station';
import { Icon, Legend } from '@/shared/ui';

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
      <Icon name="wifi-off" size={34} className="text-tone-neutral-icon" />
      <span className="font-medium text-fg">El mapa no se puede cargar sin conexión</span>
      {hasData ? <span className="text-sm">{LIST_HINT[layout]}</span> : null}
    </output>
  );
}

const UNCONFIRMED_ITEMS = [{ tone: 'muted', text: 'Gris = dato sin confirmar' }] as const;

// Bottom left, clear of the attribution and the controls on the right. The rows already say
// «sin confirmar» in words, so this is for sighted users only.
function UnconfirmedLegend() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-control bg-surface px-3 py-2 shadow-control"
    >
      <Legend label="Leyenda del mapa" items={UNCONFIRMED_ITEMS} />
    </div>
  );
}

// Offline, the layer hides the grey points, so the legend only comes with stale data.
export function MapNotice({ status, hasData, layout }: MapNoticeProps) {
  if (status === 'offline') return <OfflineLayer hasData={hasData} layout={layout} />;
  // With data a failure reads as stale, not error: error always means an empty map.
  if (status === 'error') return <ServiceNotice layout={layout} />;
  if (status === 'stale' && layout === 'desktop') return <UnconfirmedLegend />;
  return null;
}
