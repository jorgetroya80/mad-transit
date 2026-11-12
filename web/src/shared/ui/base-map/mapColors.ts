// The points take their colors from the map-point library; only the user location is drawn here.
export type MapColors = { userLocation: string; pointStroke: string };

// The theme tokens in index.css are the single source of these colors; MapLibre paint
// properties cannot read CSS variables, so their values are copied when the layers are added.
export function readMapColors(): MapColors {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(`--color-${name}`).trim();

  return { userLocation: token('map-user-location'), pointStroke: token('map-point-stroke') };
}
