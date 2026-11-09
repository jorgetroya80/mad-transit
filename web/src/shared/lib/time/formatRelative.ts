const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

// Never in the future: useNow ticks every 30 s, so data that arrived after the last tick (or a
// server clock slightly ahead) is dated after `now`, and reads as just now.
function secondsAgo(date: Date, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - date.getTime()) / MS_PER_SECOND));
}

export function isJustNow(date: Date, now: Date): boolean {
  return secondsAgo(date, now) === 0;
}

export function formatRelative(date: Date, now: Date): string {
  const seconds = secondsAgo(date, now);
  if (seconds < SECONDS_PER_MINUTE) return rtf.format(-seconds, 'second');
  return rtf.format(-Math.round(seconds / SECONDS_PER_MINUTE), 'minute');
}

// «hace 12 min»: the age in rounded minutes, as the stale notices give it.
export function formatMinutesAgo(date: Date, now: Date): string {
  const seconds = secondsAgo(date, now);
  if (seconds < SECONDS_PER_MINUTE) return 'hace menos de 1 min';
  return `hace ${Math.round(seconds / SECONDS_PER_MINUTE)} min`;
}
