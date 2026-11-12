import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import {
  drawMapPoint,
  type MapPointDrawing,
  type MapPointParams,
  type MapPointStyle,
  mapPointImageId,
  mapPointSize,
  mapPointValueFont,
  readMapPointStyle,
} from '../map-point';
import { readMapColors } from './mapColors';
import {
  POINT_LAYER_ID,
  POINTS_SOURCE_ID,
  pointLayer,
  toFeatureCollection,
  toUserLocationCollection,
  USER_LOCATION_SOURCE_ID,
  userLocationLayer,
} from './points';

const POINTER_CURSOR = 'pointer';
const DEFAULT_CURSOR = '';
// Sharp on most screens; a higher ratio only makes every image bigger in memory.
const MAX_PIXEL_RATIO = 2;

type MissingImageResolver = (id: string) => Promise<void>;

export type PointImageHost = {
  hasImage(id: string): boolean;
  addImage(id: string, image: ImageData, options: { pixelRatio: number }): void;
  setMissingStyleImageResolver(resolver: MissingImageResolver | null): unknown;
};

export type PointImages = {
  // The params of the images the points may ask for, so they can be drawn on demand.
  remember(params: readonly MapPointParams[]): void;
  stop(): void;
};

function createPointImage(params: MapPointParams, drawing: MapPointDrawing) {
  const size = Math.ceil(mapPointSize(params) * drawing.pixelRatio);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  drawMapPoint(context, params, drawing);
  return context.getImageData(0, 0, size, size);
}

// Without the fonts API, or if the font fails, the points are drawn in the fallback font.
function loadValueFont(style: MapPointStyle): Promise<unknown> {
  return document.fonts?.load(mapPointValueFont(style)).catch(() => undefined) ?? Promise.resolve();
}

// Draws each point image the first time the layer asks for it. MapLibre 6 awaits the resolver
// before laying the tile out, while `styleimagemissing` comes too late: an image added there only
// shows on the next layout, so a newly selected point vanished until a zoom. The value is drawn
// inside the image, so the resolver waits for its font and never draws a point twice.
export function paintMissingPointImages(map: PointImageHost, style: MapPointStyle): PointImages {
  const drawing = { pixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO), style };
  const paramsById = new Map<string, MapPointParams>();
  const fontLoaded = loadValueFont(style);
  let isStopped = false;
  const isWanted = (id: string) => !isStopped && paramsById.has(id) && !map.hasImage(id);
  const paintMissingImage: MissingImageResolver = async (id) => {
    if (!isWanted(id)) return;
    await fontLoaded;
    const params = paramsById.get(id);
    if (!params || !isWanted(id)) return;
    const image = createPointImage(params, drawing);
    if (image) map.addImage(id, image, { pixelRatio: drawing.pixelRatio });
  };
  map.setMissingStyleImageResolver(paintMissingImage);
  return {
    remember: (params) => {
      for (const point of params) paramsById.set(mapPointImageId(point), point);
    },
    stop: () => {
      isStopped = true;
      map.setMissingStyleImageResolver(null);
    },
  };
}

// Needs a loaded style: MapLibre rejects sources and layers added before it. Returns the point
// images, to remember the points set and to stop drawing them.
export function addPointLayers(map: MapLibreMap) {
  const pointImages = paintMissingPointImages(map, readMapPointStyle());
  map.addSource(POINTS_SOURCE_ID, { type: 'geojson', data: toFeatureCollection([]) });
  map.addSource(USER_LOCATION_SOURCE_ID, {
    type: 'geojson',
    data: toUserLocationCollection(undefined),
  });
  map.addLayer(pointLayer());
  map.addLayer(userLocationLayer(readMapColors()));
  return pointImages;
}

export function listenToPointClicks(map: MapLibreMap, onSelect: (id: string) => void) {
  map.on('click', POINT_LAYER_ID, (event) => {
    const id: unknown = event.features?.[0]?.properties['id'];
    if (typeof id === 'string') onSelect(id);
  });
  map.on('mouseenter', POINT_LAYER_ID, () => {
    map.getCanvas().style.cursor = POINTER_CURSOR;
  });
  map.on('mouseleave', POINT_LAYER_ID, () => {
    map.getCanvas().style.cursor = DEFAULT_CURSOR;
  });
}

export function setSourceData(map: MapLibreMap, sourceId: string, data: GeoJSON.GeoJSON) {
  map.getSource<GeoJSONSource>(sourceId)?.setData(data);
}
