import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useRef } from 'react';
import { MapControls, type MapControlsOptions } from './MapControls';
import type { FocusPadding, LngLat, MapPoint } from './points';
import { useEaseTo, useMapLibre, usePointsData, useUserLocationData } from './useMapLibre';

// MapLibre derives the worker URL from its own import.meta.url, which neither Vite's dev
// pre-bundling nor the production build preserve; Vite bundles the worker and gives its URL.
setWorkerUrl(workerUrl);

export type BaseMapProps = {
  className?: string;
  label?: string;
  points?: readonly MapPoint[];
  selectedId?: string;
  onSelectPoint?: (id: string) => void;
  focus?: LngLat;
  focusPadding?: FocusPadding;
  userLocation?: LngLat;
  // Shows the zoom controls, and recentering if it has `onRecenter`; without it the map has none.
  controls?: MapControlsOptions;
};

// Module-level so a map without points keeps the same array and does not reset its data.
const NO_POINTS: readonly MapPoint[] = [];

// Points are not keyboard-accessible by design: lists and search reach every point.
export function BaseMap({
  className,
  label = 'Mapa de Madrid',
  points = NO_POINTS,
  selectedId,
  onSelectPoint,
  focus,
  focusPadding,
  userLocation,
  controls,
}: BaseMapProps) {
  const containerRef = useRef<HTMLElement>(null);
  const loadedMap = useMapLibre(containerRef, onSelectPoint);
  const map = loadedMap?.map;
  usePointsData(loadedMap, points, selectedId);
  useUserLocationData(map, userLocation);
  useEaseTo(map, focus, focusPadding);

  // MapLibre adds its canvas next to the controls and leaves them alone. `isolate` keeps the
  // controls' z-index inside the map, so anything laid over the map, like a card, stays on top.
  return (
    <section
      ref={containerRef}
      aria-label={label}
      className={['isolate', className].filter(Boolean).join(' ')}
    >
      {map && controls && (
        <MapControls onZoomIn={() => map.zoomIn()} onZoomOut={() => map.zoomOut()} {...controls} />
      )}
    </section>
  );
}
