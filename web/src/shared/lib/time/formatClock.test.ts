import { formatClock } from './formatClock';

// Built from the local hours and minutes, so the test holds in any time zone.
function localClock(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

describe('formatClock', () => {
  it.each([
    new Date('2026-11-09T10:42:00Z'),
    new Date('2026-11-09T21:05:59Z'),
    new Date('2026-11-09T00:00:00Z'),
  ])('gives the local time of %s as HH:MM in 24 h', (date) => {
    expect(formatClock(date)).toBe(localClock(date));
  });
});
