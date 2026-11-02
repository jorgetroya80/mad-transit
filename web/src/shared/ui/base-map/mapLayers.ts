import type { GeoJSONSource, Map } from 'maplibre-gl';
import { readMapColors, readMapFontFamily } from './mapColors';
import { createPointImage, type PointStyle } from './pointImage';
import {
  parsePointImageId,
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
const IMAGE_MISSING_EVENT = 'styleimagemissing';
// Sharp on most screens; a higher ratio only makes every image bigger in memory.
const MAX_PIXEL_RATIO = 2;

type ImageMissingListener = (event: { id: string }) => void;

export type PointImageHost = {
  hasImage(id: string): boolean;
  addImage(id: string, image: ImageData, options: { pixelRatio: number }): void;
  on(type: typeof IMAGE_MISSING_EVENT, listener: ImageMissingListener): unknown;
  off(type: typeof IMAGE_MISSING_EVENT, listener: ImageMissingListener): unknown;
};

// Paints each point image the first time the layer asks for it; returns how to stop.
export function paintMissingPointImages(map: PointImageHost, style: PointStyle) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const onImageMissing: ImageMissingListener = ({ id }) => {
    const spec = parsePointImageId(id);
    if (!spec || map.hasImage(id)) return;
    const image = createPointImage(spec, style, pixelRatio);
    if (image) map.addImage(id, image, { pixelRatio });
  };
  map.on(IMAGE_MISSING_EVENT, onImageMissing);
  return () => {
    map.off(IMAGE_MISSING_EVENT, onImageMissing);
  };
}

// Needs a loaded style: MapLibre rejects sources and layers added before it. Returns how to stop
// painting the point images.
export function addPointLayers(map: Map) {
  const colors = readMapColors();
  const stopPainting = paintMissingPointImages(map, { colors, fontFamily: readMapFontFamily() });
  map.addSource(POINTS_SOURCE_ID, { type: 'geojson', data: toFeatureCollection([]) });
  map.addSource(USER_LOCATION_SOURCE_ID, {
    type: 'geojson',
    data: toUserLocationCollection(undefined),
  });
  map.addLayer(pointLayer());
  map.addLayer(userLocationLayer(colors));
  return stopPainting;
}

export function listenToPointClicks(map: Map, onSelect: (id: string) => void) {
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

export function setSourceData(map: Map, sourceId: string, data: GeoJSON.GeoJSON) {
  map.getSource<GeoJSONSource>(sourceId)?.setData(data);
}
