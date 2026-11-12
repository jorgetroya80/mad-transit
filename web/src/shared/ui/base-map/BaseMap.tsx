import { type Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useRef } from 'react';
import { ControlGroup } from '../control-group';
import { IconButton } from '../icon-button';
import type { FocusPadding, LngLat, MapPoint } from './points';
import { useEaseTo, useMapLibre, usePointsData, useUserLocationData } from './useMapLibre';

// MapLibre derives the worker URL from its own import.meta.url, which neither Vite's dev
// pre-bundling nor the production build preserve; Vite bundles the worker and gives its URL.
setWorkerUrl(workerUrl);

// The zoom buttons are always there; recentering only with `onRecenter`.
export type MapControlsOptions = {
  onRecenter?: () => void;
  isRecentering?: boolean;
};

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

// Above the compact attribution, which MapLibre puts in the bottom right corner from md up.
// Recentering is busy rather than disabled: a disabled button would lose the focus the user
// just put on it.
function MapControls({
  map,
  onRecenter,
  isRecentering = false,
}: MapControlsOptions & { map: MapLibreMap }) {
  return (
    <div className="absolute right-4 bottom-12 z-10 flex flex-col gap-2">
      <ControlGroup label="Zoom del mapa">
        <IconButton label="Acercar" icon="plus" onClick={() => map.zoomIn()} />
        <IconButton label="Alejar" icon="minus" onClick={() => map.zoomOut()} />
      </ControlGroup>
      {onRecenter && (
        <IconButton
          label="Centrar en mi posición"
          icon="locate"
          variant="floating"
          iconTone="primary"
          busy={isRecentering}
          onClick={onRecenter}
        />
      )}
    </div>
  );
}

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
      {map && controls && <MapControls map={map} {...controls} />}
    </section>
  );
}
