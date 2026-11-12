import type { Arrival } from './types';

export function formatArrival({ minutes, noEstimate }: Arrival): string {
  if (noEstimate || minutes === null) return 'Sin estimación';
  if (minutes === 0) return 'Llegando';
  return `${minutes} min`;
}
