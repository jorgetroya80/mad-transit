import { MAP_POINT_TONES, type MapPointTone } from './points';

export type ToneColors = { fill: string; text: string };

export type MapColors = {
  tones: Record<MapPointTone, ToneColors>;
  userLocation: string;
  pointStroke: string;
  pointSelectedStroke: string;
  emptyStroke: string;
};

const FALLBACK_FONT_FAMILY = 'sans-serif';

// The theme tokens in index.css are the single source of these colors; MapLibre paint
// properties cannot read CSS variables, so their values are copied when the layers are added.
export function readMapColors(): MapColors {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(`--color-${name}`).trim();
  const toneColors = (tone: MapPointTone): ToneColors => ({
    fill: token(`availability-${tone}`),
    text: token(`availability-${tone}-foreground`),
  });

  return {
    tones: Object.fromEntries(MAP_POINT_TONES.map((tone) => [tone, toneColors(tone)])) as Record<
      MapPointTone,
      ToneColors
    >,
    userLocation: token('map-user-location'),
    pointStroke: token('map-point-stroke'),
    pointSelectedStroke: token('map-point-selected-stroke'),
    emptyStroke: token('availability-empty-line'),
  };
}

// The point images write their numbers in the app font.
export function readMapFontFamily(): string {
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
  return family || FALLBACK_FONT_FAMILY;
}
