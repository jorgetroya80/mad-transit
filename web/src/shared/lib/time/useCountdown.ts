import { useNow } from './useNow';

const SECOND_MS = 1000;

// Rounded up, so 0 only shows once the time is up.
export function useCountdown(until: Date): number {
  const now = useNow(SECOND_MS);
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / SECOND_MS));
}
