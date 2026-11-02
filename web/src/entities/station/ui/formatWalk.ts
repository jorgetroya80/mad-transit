const WALKING_METERS_PER_MINUTE = 80;
const MIN_WALK_MINUTES = 1;

function walkMinutes(meters: number): number {
  return Math.max(MIN_WALK_MINUTES, Math.ceil(meters / WALKING_METERS_PER_MINUTE));
}

export function formatWalk(meters: number): string {
  return `${walkMinutes(meters)} min a pie`;
}

export function formatSpokenWalk(meters: number): string {
  const minutes = walkMinutes(meters);
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} a pie`;
}
