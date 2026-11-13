import type { DataStatus } from '@/entities/station';
import { formatRelative, isJustNow } from '@/shared/lib';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';
type LoadedStatus = Exclude<DataStatus, 'loading'>;

export type Freshness = { text: string; tone: Tone; action?: string };

// A data status, not an availability level, so it keeps its own table of tones.
const LOADED = {
  ok: { tone: 'success', action: 'Actualizar' },
  stale: { tone: 'warning', action: 'Reintentar' },
  error: { tone: 'danger', action: 'Reintentar' },
  offline: { tone: 'neutral', action: 'Reintentar' },
} as const satisfies Record<LoadedStatus, { tone: Tone; action: string }>;

export function freshnessOf(status: DataStatus, updatedAt: Date | undefined, now: Date): Freshness {
  if (status === 'loading') return { text: 'Cargando…', tone: 'neutral' };
  return { ...LOADED[status], text: textOf(status, updatedAt, now) };
}

function textOf(status: LoadedStatus, updatedAt: Date | undefined, now: Date): string {
  if (status === 'error') return 'Sin datos del servicio';
  if (status === 'offline') return 'Desconectado';
  if (!updatedAt) return status === 'ok' ? 'Actualizado' : 'Datos sin confirmar';
  if (status === 'ok') return `Actualizado ${formatRelative(updatedAt, now)}`;
  // «datos de ahora» says nothing, as in StaleNotice.
  if (isJustNow(updatedAt, now)) return 'Datos sin confirmar';
  return `Datos de ${formatRelative(updatedAt, now)}`;
}
