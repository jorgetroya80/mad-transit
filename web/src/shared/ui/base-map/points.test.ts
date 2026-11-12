import { mapPointImageId } from '../map-point';
import type { MapColors } from './mapColors';
import {
  POINT_LAYER_ID,
  POINTS_SOURCE_ID,
  pointImageParams,
  pointLayer,
  toFeatureCollection,
  toUserLocationCollection,
  USER_LOCATION_LAYER_ID,
  USER_LOCATION_SOURCE_ID,
  userLocationLayer,
  type MapPoint,
} from './points';

const sol: MapPoint = { id: '1a', lng: -3.7038, lat: 40.4168, value: '7', tone: 'success' };
const callao: MapPoint = { id: '2', lng: -3.7059, lat: 40.42, value: '0', tone: 'danger' };

const colors: MapColors = { userLocation: '#user', pointStroke: '#stroke' };

describe('toFeatureCollection', () => {
  it('turns each point into a GeoJSON point with [lng, lat] coordinates', () => {
    const collection = toFeatureCollection([sol, callao]);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features.map((feature) => feature.geometry)).toEqual([
      { type: 'Point', coordinates: [-3.7038, 40.4168] },
      { type: 'Point', coordinates: [-3.7059, 40.42] },
    ]);
  });

  it('keeps the id and names the image of the point, none selected by default', () => {
    const [feature] = toFeatureCollection([sol]).features;

    expect(feature?.properties).toEqual({
      id: '1a',
      imageId: mapPointImageId({ tone: 'success', value: '7', selected: false }),
      selected: false,
    });
  });

  it('names the selected image only for the selected point', () => {
    const collection = toFeatureCollection([sol, callao], '2');

    expect(collection.features.map((feature) => feature.properties.imageId)).toEqual([
      mapPointImageId({ tone: 'success', value: '7', selected: false }),
      mapPointImageId({ tone: 'danger', value: '0', selected: true }),
    ]);
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

  it('asks for the image each point names', () => {
    expect(pointLayer().layout?.['icon-image']).toEqual(['get', 'imageId']);
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

describe('pointImageParams', () => {
  it('draws each point with its own look, selected only when it is the selected one', () => {
    expect(pointImageParams([sol, callao], '1a')).toEqual([
      { tone: 'success', value: '7', selected: true },
      { tone: 'danger', value: '0', selected: false },
    ]);
  });

  it('selects none without a selected id', () => {
    expect(pointImageParams([sol], undefined)).toEqual([
      { tone: 'success', value: '7', selected: false },
    ]);
  });
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
