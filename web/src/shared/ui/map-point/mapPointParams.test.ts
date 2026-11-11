import type { IconName } from '../icons';
import {
  MAP_POINT_TAG_TONES,
  MAP_POINT_TONES,
  type MapPointParams,
  mapPointImageId,
} from './mapPointParams';

const BASE: MapPointParams = { tone: 'success', value: '3' };

describe('MapPointParams', () => {
  it('takes the six tones of a point, without inverse', () => {
    expectTypeOf<MapPointParams['tone']>().toEqualTypeOf<
      'success' | 'warning' | 'danger' | 'neutral' | 'muted' | 'info'
    >();
    expect(MAP_POINT_TONES).toEqual(['success', 'warning', 'danger', 'neutral', 'muted', 'info']);
  });

  it('takes a value or an icon, never both', () => {
    expectTypeOf({ tone: 'info' as const, value: '3' }).toExtend<MapPointParams>();
    expectTypeOf({ tone: 'info' as const, icon: 'bus' as IconName }).toExtend<MapPointParams>();
    expectTypeOf({ tone: 'info' as const }).toExtend<MapPointParams>();
    expectTypeOf<{
      tone: 'info';
      value: string;
      icon: IconName;
    }>().not.toExtend<MapPointParams>();
    expectTypeOf<{ tone: 'inverse'; value: string }>().not.toExtend<MapPointParams>();
  });

  it('takes the tag fill only with the tones whose value is white, so it stays readable', () => {
    expect(MAP_POINT_TAG_TONES).toEqual(['success', 'neutral', 'info']);
    expectTypeOf({ tone: 'neutral' as const, fill: 'tag' as const }).toExtend<MapPointParams>();
    expectTypeOf<{ tone: 'muted'; fill: 'tag' }>().not.toExtend<MapPointParams>();
    expectTypeOf<{ tone: 'warning'; fill: 'tag' }>().not.toExtend<MapPointParams>();
    expectTypeOf<{ tone: 'danger'; fill: 'tag' }>().not.toExtend<MapPointParams>();
  });
});

describe('mapPointImageId', () => {
  it('gives the same id for the same point, with or without its defaults spelled out', () => {
    expect(mapPointImageId(BASE)).toBe(mapPointImageId({ tone: 'success', value: '3' }));
    expect(mapPointImageId(BASE)).toBe(
      mapPointImageId({ ...BASE, shape: 'circle', fill: 'tone', selected: false }),
    );
    expect(mapPointImageId(BASE)).toMatch(/^map-point:/);
  });

  it.each<[string, MapPointParams]>([
    ['tone', { ...BASE, tone: 'warning' }],
    ['value', { ...BASE, value: '4' }],
    ['shape', { ...BASE, shape: 'square' }],
    ['fill', { tone: 'success', value: '3', fill: 'tag' }],
    ['selected', { ...BASE, selected: true }],
    ['content', { tone: 'success' }],
  ])('gives another id when the %s changes', (_param, changed) => {
    expect(mapPointImageId(changed)).not.toBe(mapPointImageId(BASE));
  });

  it('tells the value «bus» from the icon bus', () => {
    expect(mapPointImageId({ tone: 'neutral', value: 'bus' })).not.toBe(
      mapPointImageId({ tone: 'neutral', icon: 'bus' }),
    );
  });

  it('gives a distinct id to every combination', () => {
    const ids = MAP_POINT_TONES.flatMap((tone) =>
      [false, true].flatMap((selected) => [
        mapPointImageId({ tone, selected, value: '3' }),
        mapPointImageId({ tone, selected, shape: 'square', icon: 'bus' }),
      ]),
    );
    const tagIds = MAP_POINT_TAG_TONES.flatMap((tone) =>
      [false, true].map((selected) =>
        mapPointImageId({ tone, selected, shape: 'square', fill: 'tag', icon: 'bus' }),
      ),
    );
    ids.push(...tagIds);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
