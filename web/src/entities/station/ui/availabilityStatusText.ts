import type { AvailabilityLevel, Need } from '../model/types';

const STATUS_TEXT = {
  good: { bikes: 'Disponible', docks: 'Disponible' },
  low: { bikes: 'Pocas', docks: 'Pocos' },
  empty: { bikes: 'Sin bicis', docks: 'Sin hueco' },
  off: { bikes: 'Fuera de servicio', docks: 'Fuera de servicio' },
  unconfirmed: { bikes: 'Sin confirmar', docks: 'Sin confirmar' },
} as const satisfies Record<AvailabilityLevel, Record<Need, string>>;

export function availabilityStatusText(level: AvailabilityLevel, need: Need): string {
  return STATUS_TEXT[level][need];
}
