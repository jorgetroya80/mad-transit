import type { GeoJSONSource, Map } from 'maplibre-gl';
import { readMapColors, readMapFontFamily } from './mapColors';
import { createPointImage, labelFont, type PointStyle } from './pointImage';
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
// Sharp on most screens; a higher ratio only makes every image bigger in memory.
const MAX_PIXEL_RATIO = 2;

type MissingImageResolver = (id: string) => void;

export type PointImageHost = {
  hasImage(id: string): boolean;
  addImage(id: string, image: ImageData, options: { pixelRatio: number }): void;
  updateImage(id: string, image: ImageData): void;
  setMissingStyleImageResolver(resolver: MissingImageResolver | null): unknown;
};

// Paints each point image the first time the layer asks for it; returns how to stop. MapLibre 6
// calls the resolver before laying the tile out, while `styleimagemissing` comes too late: an image
// added there only shows on the next layout, so a newly selected point vanished until a zoom.
// Images painted before the app font loaded are painted again once it has.
export function paintMissingPointImages(map: PointImageHost, style: PointStyle) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const painted = new Set<string>();
  let isStopped = false;
  const paintMissingImage: MissingImageResolver = (id) => {
    const spec = parsePointImageId(id);
    if (!spec || map.hasImage(id)) return;
    const image = createPointImage(spec, style, pixelRatio);
    if (!image) return;
    map.addImage(id, image, { pixelRatio });
    painted.add(id);
  };
  const repaintInFont = () => {
    if (isStopped) return;
    for (const id of painted) {
      const spec = parsePointImageId(id);
      const image = spec && createPointImage(spec, style, pixelRatio);
      if (image) map.updateImage(id, image);
    }
  };
  void document.fonts?.load(labelFont(style)).then(repaintInFont, () => {});
  map.setMissingStyleImageResolver(paintMissingImage);
  return () => {
    isStopped = true;
    map.setMissingStyleImageResolver(null);
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
