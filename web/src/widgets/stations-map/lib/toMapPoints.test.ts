import type { Station } from '@/entities/station';
import { stationsFixture } from '@/shared/api/mocks/fixtures';
import { toMapPoints } from './toMapPoints';

const { stations } = stationsFixture;

describe('toMapPoints', () => {
  it('keeps one point per station, identified by its number at its coordinates', () => {
    const points = toMapPoints(stations, 'bikes', 'ok');

    expect(points.map(({ id, lng, lat }) => ({ id, lng, lat }))).toEqual(
      stations.map(({ number, lon, lat }) => ({ id: number, lng: lon, lat })),
    );
  });

  it('shows the bikes and their availability when looking for bikes', () => {
    const points = toMapPoints(stations, 'bikes', 'ok');

    expect(points.map(({ id, value, tone }) => ({ id, value, tone }))).toEqual([
      { id: '1a', value: '12', tone: 'success' },
      { id: '1b', value: '2', tone: 'warning' },
      { id: '2', value: '–', tone: 'neutral' },
      { id: '3', value: '0', tone: 'danger' },
    ]);
  });

  it('shows the free docks and their availability when looking for docks', () => {
    const points = toMapPoints(stations, 'docks', 'ok');

    expect(points.map(({ id, value, tone }) => ({ id, value, tone }))).toEqual([
      { id: '1a', value: '12', tone: 'success' },
      { id: '1b', value: '22', tone: 'success' },
      { id: '2', value: '–', tone: 'neutral' },
      { id: '3', value: '18', tone: 'success' },
    ]);
  });

  it('shows a dash, not the count, for a station out of service', () => {
    const offStations: Station[] = stations
      .slice(0, 1)
      .map((station) => ({ ...station, status: 'NO_SERVICE', bikes: 7 }));

    expect(toMapPoints(offStations, 'bikes', 'ok')).toEqual([
      expect.objectContaining({ value: '–', tone: 'neutral' }),
    ]);
  });

  it('leaves the selection to the map, so selecting a station keeps the same points', () => {
    const points = toMapPoints(stations, 'bikes', 'ok');

    expect(points.some((point) => 'selected' in point)).toBe(false);
  });

  it('returns no points without stations', () => {
    expect(toMapPoints([], 'bikes', 'ok')).toEqual([]);
  });

  it.each(['stale', 'offline'] as const)(
    'greys every point out when %s, keeping the count',
    (status) => {
      const points = toMapPoints(stations, 'bikes', status);

      expect(points.map(({ id, value, tone }) => ({ id, value, tone }))).toEqual([
        { id: '1a', value: '12', tone: 'muted' },
        { id: '1b', value: '2', tone: 'muted' },
        { id: '2', value: '0', tone: 'muted' },
        { id: '3', value: '0', tone: 'muted' },
      ]);
    },
  );
});
