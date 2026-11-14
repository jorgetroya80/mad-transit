import { useState } from 'react';
import type { GeoPosition } from './useGeolocation';

type Kept = { focus: GeoPosition; mapCenter: GeoPosition | undefined };

// Closing the selection keeps the map where it is: the last selected focus stays until
// `mapCenter` changes, as "Mi ubicación" does, and from then on the map follows `mapCenter`.
export function useKeptFocus(
  selectedFocus: GeoPosition | undefined,
  mapCenter: GeoPosition | undefined,
): GeoPosition | undefined {
  const [kept, setKept] = useState<Kept | undefined>(undefined);
  // Adjusted during render, comparing numbers: the props are new objects on every render.
  if (selectedFocus) {
    if (!kept || !isSamePlace(kept.focus, selectedFocus) || !isSamePlace(kept.mapCenter, mapCenter))
      setKept({ focus: selectedFocus, mapCenter });
    return selectedFocus;
  }
  if (kept && isSamePlace(kept.mapCenter, mapCenter)) return kept.focus;
  if (kept) setKept(undefined);
  return mapCenter;
}

function isSamePlace(a: GeoPosition | undefined, b: GeoPosition | undefined): boolean {
  return a?.lng === b?.lng && a?.lat === b?.lat;
}
