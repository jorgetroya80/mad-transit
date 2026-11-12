import { arrivingArrival, noEstimateArrival, soonArrival } from '@/shared/api/mocks/fixtures';
import { formatArrival } from './formatArrival';

describe('formatArrival', () => {
  it('says the bus is arriving at 0 minutes', () => {
    expect(formatArrival(arrivingArrival)).toBe('Llegando');
  });

  it('counts the minutes left', () => {
    expect(formatArrival(soonArrival)).toBe('2 min');
  });

  it('says there is no estimate when the EMT has none', () => {
    expect(formatArrival(noEstimateArrival)).toBe('Sin estimación');
  });

  it('says there is no estimate without minutes', () => {
    expect(formatArrival({ ...soonArrival, minutes: null })).toBe('Sin estimación');
  });
});
