import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import type { MapColors } from './mapColors';

export const MAP_POINT_TONES = ['good', 'low', 'empty', 'off', 'unconfirmed'] as const;

export type MapPointTone = (typeof MAP_POINT_TONES)[number];

export type LngLat = { lng: number; lat: number };

export type MapPoint = LngLat & { id: string; label: string; tone: MapPointTone };

type MapPointProperties = Pick<MapPoint, 'id' | 'label' | 'tone'> & { selected: boolean };

export const POINTS_SOURCE_ID = 'points';
export const POINT_LAYER_ID = 'point-images';
export const USER_LOCATION_SOURCE_ID = 'user-location';
export const USER_LOCATION_LAYER_ID = 'user-location-dot';

const USER_LOCATION_RADIUS_PX = 8;
const USER_LOCATION_STROKE_WIDTH_PX = 3;
const SELECTED_SORT_KEY = 1;
const UNSELECTED_SORT_KEY = 0;
const POINT_IMAGE_PREFIX = 'point';
const POINT_IMAGE_SEPARATOR = ':';
const SELECTED_FLAG = '1';
const UNSELECTED_FLAG = '0';

const isSelected: ExpressionSpecification = ['get', 'selected'];

export type PointImageSpec = Omit<MapPointProperties, 'id'>;

function toPoint({ lng, lat }: LngLat): GeoJSON.Point {
  return { type: 'Point', coordinates: [lng, lat] };
}

export function toFeatureCollection(
  points: readonly MapPoint[],
  selectedId?: string,
): GeoJSON.FeatureCollection<GeoJSON.Point, MapPointProperties> {
  return {
    type: 'FeatureCollection',
    features: points.map(({ id, label, tone, ...position }) => ({
      type: 'Feature',
      geometry: toPoint(position),
      properties: { id, label, tone, selected: id === selectedId },
    })),
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

// The label goes last, so the first separators split the id whatever the label holds.
export function pointImageId({ tone, selected, label }: PointImageSpec): string {
  const flag = selected ? SELECTED_FLAG : UNSELECTED_FLAG;
  return [POINT_IMAGE_PREFIX, tone, flag, label].join(POINT_IMAGE_SEPARATOR);
}

function isMapPointTone(value: string | undefined): value is MapPointTone {
  return MAP_POINT_TONES.some((tone) => tone === value);
}

export function parsePointImageId(id: string): PointImageSpec | undefined {
  const [prefix, tone, flag, ...label] = id.split(POINT_IMAGE_SEPARATOR);
  if (prefix !== POINT_IMAGE_PREFIX || !isMapPointTone(tone) || label.length === 0)
    return undefined;
  return { tone, selected: flag === SELECTED_FLAG, label: label.join(POINT_IMAGE_SEPARATOR) };
}

// Each point is one image with its number already drawn: in a single symbol layer MapLibre draws
// every icon before every text, so a separate number would land on top of a neighbour's circle.
export function pointLayer(): SymbolLayerSpecification {
  return {
    id: POINT_LAYER_ID,
    type: 'symbol',
    source: POINTS_SOURCE_ID,
    layout: {
      'icon-image': [
        'concat',
        `${POINT_IMAGE_PREFIX}${POINT_IMAGE_SEPARATOR}`,
        ['get', 'tone'],
        POINT_IMAGE_SEPARATOR,
        whenSelected(SELECTED_FLAG, UNSELECTED_FLAG),
        POINT_IMAGE_SEPARATOR,
        ['get', 'label'],
      ],
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
