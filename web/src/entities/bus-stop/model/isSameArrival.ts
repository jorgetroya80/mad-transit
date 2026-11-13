import type { ArrivalRef } from './types';

export function isSameArrival(a: ArrivalRef, b: ArrivalRef): boolean {
  return a.line === b.line && a.destination === b.destination;
}
