import type { ComponentProps } from 'react';
import { NOW_TICK_MS } from '@/shared/config';
import { formatRelative, isJustNow, useNow, usePendingAction } from '@/shared/lib';
import { Button } from '../button';
import { StatusText } from '../status-text';

// The same union as entities/station's DataStatus, which shared cannot import.
type FreshnessStatus = 'loading' | 'ok' | 'stale' | 'error' | 'offline';
type LoadedStatus = Exclude<FreshnessStatus, 'loading'>;

// A returned promise keeps the button busy until it settles; anything else is fire and forget.
type Retry = () => unknown;

type UpdatedIndicatorProps = {
  status: FreshnessStatus;
  updatedAt: Date | undefined;
  onRetry: Retry;
};

type StatusTone = ComponentProps<typeof StatusText>['tone'];

// A data status, not an availability level, so it keeps its own table of tones.
const INDICATOR = {
  ok: { tone: 'success', action: 'Actualizar' },
  stale: { tone: 'warning', action: 'Reintentar' },
  error: { tone: 'danger', action: 'Reintentar' },
  offline: { tone: 'neutral', action: 'Reintentar' },
} as const satisfies Record<LoadedStatus, { tone: StatusTone; action: string }>;

// Not live: the text ticks every 30 s, and each notice of the page announces its own cause.
export function UpdatedIndicator({ status, updatedAt, onRetry }: UpdatedIndicatorProps) {
  const now = useNow(NOW_TICK_MS);
  const { isPending, run } = usePendingAction(onRetry);
  if (status === 'loading') return <p className="text-body text-fg-muted">Cargando…</p>;
  const { tone, action } = INDICATOR[status];
  return (
    <div className="flex items-center gap-3">
      <StatusText tone={tone} text={freshnessText(status, updatedAt, now)} />
      <Button
        size="sm"
        variant="secondary"
        icon="refresh"
        label={action}
        onClick={run}
        busy={isPending}
      />
    </div>
  );
}

function freshnessText(status: LoadedStatus, updatedAt: Date | undefined, now: Date): string {
  if (status === 'error') return 'Sin datos del servicio';
  if (status === 'offline') return 'Desconectado';
  if (!updatedAt) return status === 'ok' ? 'Actualizado' : 'Datos sin confirmar';
  if (status === 'ok') return `Actualizado ${formatRelative(updatedAt, now)}`;
  // «datos de ahora» says nothing, as in StaleNotice.
  if (isJustNow(updatedAt, now)) return 'Datos sin confirmar';
  return `Datos de ${formatRelative(updatedAt, now)}`;
}
