import { type Map as MapLibreMap, Popup } from 'maplibre-gl';
import { useEffect, useState } from 'react';
import type { LngLat } from './points';

// Half of a selected point, so the popup opens above its icon instead of over it.
const POPUP_OFFSET_PX = 24;

// One MapLibre popup per point, open while there is one. Returns the element its content is
// rendered in: it exists from the start, and MapLibre puts it on the map when the popup opens.
export function useMapPopup(map: MapLibreMap | undefined, at: LngLat | undefined) {
  const [element] = useState(() => document.createElement('div'));
  const lng = at?.lng;
  const lat = at?.lat;

  useEffect(() => {
    if (!map || lng === undefined || lat === undefined) return;
    const popup = new Popup({ closeButton: false, closeOnClick: false, offset: POPUP_OFFSET_PX })
      .setLngLat({ lng, lat })
      .setDOMContent(element)
      .addTo(map);
    return () => {
      popup.remove();
    };
  }, [element, map, lng, lat]);

  return element;
}
