import type { MapColors } from './mapColors';
import {
  parsePointImageId,
  POINT_LAYER_ID,
  POINTS_SOURCE_ID,
  pointImageId,
  pointLayer,
  toFeatureCollection,
  toUserLocationCollection,
  USER_LOCATION_LAYER_ID,
  USER_LOCATION_SOURCE_ID,
  userLocationLayer,
  type MapPoint,
} from './points';

const sol: MapPoint = { id: '1a', lng: -3.7038, lat: 40.4168, label: '7', tone: 'good' };
const callao: MapPoint = { id: '2', lng: -3.7059, lat: 40.42, label: '0', tone: 'empty' };

const colors: MapColors = {
  tones: {
    good: { fill: '#good', text: '#good-text' },
    low: { fill: '#low', text: '#low-text' },
    empty: { fill: '#empty', text: '#empty-text' },
    off: { fill: '#off', text: '#off-text' },
    unconfirmed: { fill: '#unconfirmed', text: '#unconfirmed-text' },
  },
  userLocation: '#user',
  pointStroke: '#stroke',
  pointSelectedStroke: '#selected-stroke',
  emptyStroke: '#empty-stroke',
};

describe('toFeatureCollection', () => {
  it('turns each point into a GeoJSON point with [lng, lat] coordinates', () => {
    const collection = toFeatureCollection([sol, callao]);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features.map((feature) => feature.geometry)).toEqual([
      { type: 'Point', coordinates: [-3.7038, 40.4168] },
      { type: 'Point', coordinates: [-3.7059, 40.42] },
    ]);
  });

  it('keeps id, label and tone as properties, none selected by default', () => {
    const [feature] = toFeatureCollection([sol]).features;

    expect(feature?.properties).toEqual({ id: '1a', label: '7', tone: 'good', selected: false });
  });

  it('flags only the selected point', () => {
    const collection = toFeatureCollection([sol, callao], '2');

    expect(collection.features.map((feature) => feature.properties.selected)).toEqual([
      false,
      true,
    ]);
  });

  it('is empty without points', () => {
    expect(toFeatureCollection([]).features).toEqual([]);
  });
});

describe('toUserLocationCollection', () => {
  it('has one point at the user location', () => {
    expect(toUserLocationCollection({ lng: -3.7, lat: 40.4 }).features).toEqual([
      { type: 'Feature', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {} },
    ]);
  });

  it('is empty without a location', () => {
    expect(toUserLocationCollection(undefined).features).toEqual([]);
  });
});

describe('pointLayer', () => {
  it('draws every point as one image from the points source, with no separate text', () => {
    const layer = pointLayer();

    expect(layer).toMatchObject({ id: POINT_LAYER_ID, type: 'symbol', source: POINTS_SOURCE_ID });
    expect(layer.layout?.['text-field']).toBeUndefined();
  });

  it('names the image of each point after its tone, selection and label', () => {
    expect(pointLayer().layout?.['icon-image']).toEqual([
      'concat',
      'point:',
      ['get', 'tone'],
      ':',
      ['case', ['get', 'selected'], '1', '0'],
      ':',
      ['get', 'label'],
    ]);
  });

  it('shows every point, even when points overlap', () => {
    const { layout } = pointLayer();

    expect(layout?.['icon-allow-overlap']).toBe(true);
    expect(layout?.['icon-ignore-placement']).toBe(true);
  });

  it('draws the selected point above the rest', () => {
    expect(pointLayer().layout?.['symbol-sort-key']).toEqual(['case', ['get', 'selected'], 1, 0]);
  });
});

describe('pointImageId', () => {
  it.each([
    { tone: 'good', selected: false, label: '7', id: 'point:good:0:7' },
    { tone: 'low', selected: true, label: '25A', id: 'point:low:1:25A' },
    { tone: 'off', selected: false, label: '–', id: 'point:off:0:–' },
  ] as const)('names $label as "$id" and reads it back', (spec) => {
    const { id, ...image } = spec;

    expect(pointImageId(image)).toBe(id);
    expect(parsePointImageId(id)).toEqual(image);
  });

  it('keeps a label that contains the separator', () => {
    expect(parsePointImageId('point:good:0:1:2')).toEqual({
      tone: 'good',
      selected: false,
      label: '1:2',
    });
  });

  it.each(['road-shield', 'point:blue:0:7', 'point:good:0'])(
    'ignores "%s", which is not a point image',
    (id) => {
      expect(parsePointImageId(id)).toBeUndefined();
    },
  );
});

describe('userLocationLayer', () => {
  it('draws the user as a dot in its own source and color', () => {
    const layer = userLocationLayer(colors);

    expect(layer).toMatchObject({
      id: USER_LOCATION_LAYER_ID,
      type: 'circle',
      source: USER_LOCATION_SOURCE_ID,
    });
    expect(layer.paint?.['circle-color']).toBe('#user');
  });

  it('borders the dot with the point stroke color', () => {
    expect(userLocationLayer(colors).paint?.['circle-stroke-color']).toBe('#stroke');
  });
});
