import { formatSpokenWalk, formatWalk } from './formatWalk';

describe('formatWalk', () => {
  it.each([
    [0, '1 min a pie'],
    [80, '1 min a pie'],
    [81, '2 min a pie'],
    [1000, '13 min a pie'],
  ])('walks %d m in "%s"', (meters, expected) => {
    expect(formatWalk(meters)).toBe(expected);
  });
});

describe('formatSpokenWalk', () => {
  it.each([
    [57, '1 minuto a pie'],
    [1000, '13 minutos a pie'],
  ])('says the walk of %d m as "%s"', (meters, expected) => {
    expect(formatSpokenWalk(meters)).toBe(expected);
  });
});
