import type { BusLine } from '@/entities/bus-stop';
import { toLineRows } from './toLineRows';

const day: BusLine = {
  label: '3',
  headerA: 'Puerta del Sol',
  headerB: 'Legazpi',
  direction: 'B',
  firstBus: '06:30',
  lastBus: '23:00',
  minFrequencyMinutes: 8,
  maxFrequencyMinutes: 12,
};

const night: BusLine = {
  label: 'N1',
  headerA: 'Puerta del Sol',
  headerB: 'Cibeles',
  direction: 'A',
  firstBus: '23:30',
  lastBus: '05:30',
  minFrequencyMinutes: 20,
  maxFrequencyMinutes: 20,
};

describe('toLineRows', () => {
  it('shows the header the line goes towards, with its schedule and frequency', () => {
    expect(toLineRows([day])).toEqual([
      {
        label: '3',
        isNight: false,
        towards: 'Legazpi',
        schedule: '06:30–23:00',
        frequency: '8–12 min',
      },
    ]);
  });

  it('marks the night lines and keeps their schedule as the API gives it', () => {
    expect(toLineRows([night])).toEqual([
      {
        label: 'N1',
        isNight: true,
        towards: 'Puerta del Sol',
        schedule: '23:30–05:30',
        frequency: '20 min',
      },
    ]);
  });

  it('says there is no schedule or frequency when the API has none', () => {
    const [row] = toLineRows([
      {
        ...day,
        firstBus: null,
        lastBus: null,
        minFrequencyMinutes: null,
        maxFrequencyMinutes: null,
      },
    ]);

    expect(row).toMatchObject({ schedule: 'Sin horario', frequency: 'Sin datos' });
  });
});
