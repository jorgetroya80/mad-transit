import { useState } from 'react';
import { NOW_TICK_MS } from '@/shared/config';
import { isJustNow, useNow } from '@/shared/lib';
import { RefreshIcon } from '../icons';
import { RelativeTime } from '../relative-time';

// The same union as entities/station's DataStatus, which shared cannot import.
type FreshnessStatus = 'loading' | 'ok' | 'stale' | 'error' | 'offline';
type LoadedStatus = Exclude<FreshnessStatus, 'loading'>;

// A returned promise keeps the button busy until it settles.
type Retry = () => void | Promise<unknown>;

type UpdatedIndicatorProps = {
  status: FreshnessStatus;
  updatedAt: Date | undefined;
  onRetry: Retry;
};

const INDICATOR = {
  ok: { dot: 'bg-availability-good', action: 'Actualizar' },
  stale: { dot: 'bg-availability-low', action: 'Reintentar' },
  error: { dot: 'bg-availability-empty-line', action: 'Reintentar' },
  offline: { dot: 'bg-availability-off', action: 'Reintentar' },
} as const satisfies Record<LoadedStatus, { dot: string; action: string }>;

export function UpdatedIndicator({ status, updatedAt, onRetry }: UpdatedIndicatorProps) {
  if (status === 'loading') return <p className="text-sm text-fg-muted">Cargando…</p>;
  const { dot, action } = INDICATOR[status];
  return (
    <div className="flex items-center gap-3 text-sm text-fg-muted">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${dot}`} />
      <p>
        <FreshnessText status={status} updatedAt={updatedAt} />
      </p>
      <RetryButton label={action} onRetry={onRetry} />
    </div>
  );
}

type FreshnessTextProps = { status: LoadedStatus; updatedAt: Date | undefined };

function FreshnessText({ status, updatedAt }: FreshnessTextProps) {
  const now = useNow(NOW_TICK_MS);
  if (status === 'error') return 'Sin datos del servicio';
  if (status === 'offline') return 'Desconectado';
  if (status === 'ok') {
    return updatedAt ? (
      <>
        Actualizado <RelativeTime date={updatedAt} now={now} />
      </>
    ) : (
      'Actualizado'
    );
  }
  // «datos de ahora» says nothing, as in StaleNotice.
  if (!updatedAt || isJustNow(updatedAt, now)) return 'Datos sin confirmar';
  return (
    <>
      Datos de <RelativeTime date={updatedAt} now={now} />
    </>
  );
}

type RetryButtonProps = { label: string; onRetry: Retry };

function RetryButton({ label, onRetry }: RetryButtonProps) {
  const [isBusy, setIsBusy] = useState(false);

  function retry() {
    const pending = onRetry();
    if (!(pending instanceof Promise)) return;
    setIsBusy(true);
    const stopBusy = () => setIsBusy(false);
    void pending.then(stopBusy, stopBusy);
  }

  return (
    <button
      type="button"
      aria-busy={isBusy}
      onClick={retry}
      className="flex min-h-11 min-w-11 items-center gap-2 rounded-control px-3 font-medium text-primary hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <RefreshIcon className="size-4" />
      {label}
    </button>
  );
}
