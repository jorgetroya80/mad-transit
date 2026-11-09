import type { DataStatus, Need } from '@/entities/station';
import { NEARBY_RADIUS_M } from '@/shared/config';
import { useCountdown } from '@/shared/lib';
import { ErrorState, StateMessage, UpdatedAt, WarningIcon } from '@/shared/ui';
import type { NearbyList } from '../model/useNearbyList';
import { StationRows } from './StationRows';

type BlockingStatus = Extract<DataStatus, 'error'>;

const BLOCKING_TEXT = {
  error: {
    title: 'No podemos cargar las estaciones',
    body: 'El servicio de BiciMAD no está respondiendo. Suele ser temporal; no es un problema de tu conexión.',
    canRetry: true,
  },
} as const satisfies Record<BlockingStatus, { title: string; body: string; canRetry: boolean }>;

const RETRYING_TEXT = 'Intentándolo de nuevo…';

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
    return <StateMessage variant="loading" title="Cargando estaciones cercanas…" />;
  }
  // Offline without data shows the error block until it gets its own texts.
  if (stations === undefined) {
    const { title, body, canRetry } = BLOCKING_TEXT.error;
    return (
      <ErrorState
        tone="error"
        icon={WarningIcon}
        title={title}
        body={body}
        action={canRetry ? { label: 'Reintentar', onAction: list.retry } : undefined}
        footer={retryFooter(list)}
      />
    );
  }
  return (
    <>
      {showUpdatedAt && list.updatedAt ? <UpdatedAt date={list.updatedAt} /> : null}
      {stations.length === 0 ? (
        <StateMessage variant="empty" title={`Ninguna estación en ${NEARBY_RADIUS_M} m`} />
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
