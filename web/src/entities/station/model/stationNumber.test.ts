import { isSameStationNumber } from './stationNumber';

describe('isSameStationNumber', () => {
  it.each([
    ['1a', '1a', true],
    ['1a', '1A', true],
    ['1a', '1b', false],
    ['1a', undefined, false],
  ])('compares %s with %s: %s', (number, wanted, expected) => {
    expect(isSameStationNumber(number, wanted)).toBe(expected);
  });
});
