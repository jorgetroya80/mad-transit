import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import { mapPointImageId, type MapPointParams } from '../map-point';
import type { MapColors } from './mapColors';

export type LngLat = { lng: number; lat: number };

// Pixels of the map hidden by something on top of it: the focus is centered in the rest.
export type FocusPadding = { bottom: number; right?: number };

type WithoutSelected<T> = T extends unknown ? Omit<T, 'selected'> : never;

// The map marks the selected point from its own `selectedId`, so a point only brings its look.
export type MapPoint = LngLat & { id: string } & WithoutSelected<MapPointParams>;

type MapPointProperties = { id: string; imageId: string; selected: boolean };

export const POINTS_SOURCE_ID = 'points';
export const POINT_LAYER_ID = 'point-images';
export const USER_LOCATION_SOURCE_ID = 'user-location';
export const USER_LOCATION_LAYER_ID = 'user-location-dot';
export const USER_LOCATION_HALO_LAYER_ID = 'user-location-halo';

// A 12 px dot with a 2 px border, over a 22 px halo of its color.
const USER_LOCATION_RADIUS_PX = 6;
const USER_LOCATION_STROKE_WIDTH_PX = 2;
const USER_LOCATION_HALO_RADIUS_PX = 11;
const USER_LOCATION_HALO_OPACITY = 0.18;
const SELECTED_SORT_KEY = 1;
const UNSELECTED_SORT_KEY = 0;

const isSelected: ExpressionSpecification = ['get', 'selected'];

function toPoint({ lng, lat }: LngLat): GeoJSON.Point {
  return { type: 'Point', coordinates: [lng, lat] };
}

function toImageParams(
  { id, lng: _lng, lat: _lat, ...look }: MapPoint,
  selectedId: string | undefined,
): MapPointParams {
  return { ...look, selected: id === selectedId };
}

export function pointImageParams(
  points: readonly MapPoint[],
  selectedId: string | undefined,
): MapPointParams[] {
  return points.map((point) => toImageParams(point, selectedId));
}

function toFeature(
  point: MapPoint,
  selectedId: string | undefined,
): GeoJSON.Feature<GeoJSON.Point, MapPointProperties> {
  const imageId = mapPointImageId(toImageParams(point, selectedId));
  return {
    type: 'Feature',
    geometry: toPoint(point),
    properties: { id: point.id, imageId, selected: point.id === selectedId },
  };
}

export function toFeatureCollection(
  points: readonly MapPoint[],
  selectedId?: string,
): GeoJSON.FeatureCollection<GeoJSON.Point, MapPointProperties> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => toFeature(point, selectedId)),
  };
}

export function toUserLocationCollection(
  location: LngLat | undefined,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = location
    ? [{ type: 'Feature', geometry: toPoint(location), properties: {} }]
    : [];
  return { type: 'FeatureCollection', features };
}

function whenSelected<T>(selected: T, otherwise: T): ExpressionSpecification {
  return ['case', isSelected, selected, otherwise] as ExpressionSpecification;
}

// Each point is one image with its number already drawn: in a single symbol layer MapLibre draws
// every icon before every text, so a separate number would land on top of a neighbour's circle.
export function pointLayer(): SymbolLayerSpecification {
  return {
    id: POINT_LAYER_ID,
    type: 'symbol',
    source: POINTS_SOURCE_ID,
    layout: {
      'icon-image': ['get', 'imageId'],
      // Every point shows its number: the color alone never tells the availability.
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-sort-key': whenSelected(SELECTED_SORT_KEY, UNSELECTED_SORT_KEY),
    },
  };
}

export function userLocationLayer({
  userLocation,
  pointStroke,
}: Pick<MapColors, 'userLocation' | 'pointStroke'>): CircleLayerSpecification {
  return {
    id: USER_LOCATION_LAYER_ID,
    type: 'circle',
    source: USER_LOCATION_SOURCE_ID,
    paint: {
      'circle-color': userLocation,
      'circle-radius': USER_LOCATION_RADIUS_PX,
      'circle-stroke-width': USER_LOCATION_STROKE_WIDTH_PX,
      'circle-stroke-color': pointStroke,
    },
  };
}

export function userLocationHaloLayer({
  userLocation,
}: Pick<MapColors, 'userLocation'>): CircleLayerSpecification {
  return {
    id: USER_LOCATION_HALO_LAYER_ID,
    type: 'circle',
    source: USER_LOCATION_SOURCE_ID,
    paint: {
      'circle-color': userLocation,
      'circle-radius': USER_LOCATION_HALO_RADIUS_PX,
      'circle-opacity': USER_LOCATION_HALO_OPACITY,
    },
  };
}
