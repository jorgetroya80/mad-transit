const clock = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// «10:42»: 24 h local time, as the design dates saved and unconfirmed data.
export function formatClock(date: Date): string {
  return clock.format(date);
}
