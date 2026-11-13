import type { Need } from '@/entities/station';
import { NEARBY_RADIUS_M } from '@/shared/config';
import { useCountdown, usePendingAction, type DataStatus } from '@/shared/lib';
import { EmptyState, Spinner, UpdatedAt } from '@/shared/ui';
import type { NearbyList } from '../model/useNearbyList';
import { StationRows } from './StationRows';

type BlockingStatus = Extract<DataStatus, 'error' | 'offline'>;

// Offline needs no retry: the query asks again by itself when the connection returns.
const BLOCKING_TEXT = {
  error: {
    tone: 'danger',
    icon: 'cloud-alert',
    title: 'No podemos cargar las estaciones',
    message:
      'El servicio de BiciMAD no está respondiendo. Suele ser temporal; no es un problema de tu conexión.',
    canRetry: true,
  },
  offline: {
    tone: 'neutral',
    icon: 'wifi-off',
    title: 'Sin conexión a internet',
    message:
      'Necesitas conexión para ver las estaciones la primera vez. Se cargarán solas al volver a conectarte.',
    canRetry: false,
  },
} as const satisfies Record<
  BlockingStatus,
  {
    tone: 'danger' | 'neutral';
    icon: 'cloud-alert' | 'wifi-off';
    title: string;
    message: string;
    canRetry: boolean;
  }
>;

const RETRYING_TEXT = 'Intentándolo de nuevo…';

// The library has no small message: an EmptyState needs a body and a big icon, and these are one
// line each. Loading and empty are polite, as they have always been.
const MESSAGE_CLASSES = 'flex items-center gap-2 p-4 text-body text-fg-muted';

type NearbyStationsProps = {
  list: NearbyList;
  need: Need;
  selectedNumber: string | undefined;
  onSelect: (number: string) => void;
  // False on mobile, where the sheet header already says how old the list is.
  showUpdatedAt: boolean;
};

export function NearbyStations({
  list,
  need,
  selectedNumber,
  onSelect,
  showUpdatedAt,
}: NearbyStationsProps) {
  const { stations } = list;
  if (list.status === 'loading') {
    return (
      <output aria-busy="true" className={MESSAGE_CLASSES}>
        <Spinner className="text-primary" />
        Cargando estaciones cercanas…
      </output>
    );
  }
  if (stations === undefined) return <BlockingState list={list} />;
  return (
    <>
      {showUpdatedAt && list.updatedAt ? <UpdatedAt date={list.updatedAt} /> : null}
      {stations.length === 0 ? (
        <output className={MESSAGE_CLASSES}>{`Ninguna estación en ${NEARBY_RADIUS_M} m`}</output>
      ) : (
        <StationRows
          stations={stations}
          need={need}
          status={list.status}
          selectedNumber={selectedNumber}
          onSelect={onSelect}
        />
      )}
    </>
  );
}

type BlockingStateProps = { list: NearbyList };

// The countdown goes in its own paragraph, not in `note`, to stay explicitly off the air
// (`aria-live="off"`) as it always has; it takes the note's place and look.
function BlockingState({ list }: BlockingStateProps) {
  const { isPending, run } = usePendingAction(list.retry);
  const { canRetry, ...text } = BLOCKING_TEXT[list.status === 'offline' ? 'offline' : 'error'];
  if (!canRetry) return <EmptyState {...text} announce="alert" />;
  const footer = retryFooter(list);
  return (
    <EmptyState
      {...text}
      announce="alert"
      action={{ label: 'Reintentar', icon: 'refresh', onClick: run, busy: isPending }}
    >
      {footer ? (
        <p aria-live="off" className="text-meta text-fg-muted">
          {footer}
        </p>
      ) : null}
    </EmptyState>
  );
}

// Without a failure (offline) there is no automatic retry to count down to. The key restarts the
// clock on every new failure, so the count never starts from a tick of the previous wait.
function retryFooter({ isRetrying, nextRetryAt }: NearbyList) {
  if (isRetrying) return RETRYING_TEXT;
  if (nextRetryAt === undefined) return undefined;
  return <RetryCountdown key={nextRetryAt.getTime()} until={nextRetryAt} />;
}

type RetryCountdownProps = { until: Date };

function RetryCountdown({ until }: RetryCountdownProps) {
  const seconds = useCountdown(until);
  return seconds > 0 ? `Volveremos a intentarlo solos en ${seconds} s.` : RETRYING_TEXT;
}
