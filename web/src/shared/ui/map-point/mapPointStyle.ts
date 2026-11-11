import { MAP_POINT_TONES, type MapPointTone } from './mapPointParams';

export type MapPointToneColors = { fill: string; text: string };

export type MapPointColors = {
  tones: Record<MapPointTone, MapPointToneColors>;
  // Only these tones have a border of their own, drawn instead of the halo.
  lines: Partial<Record<MapPointTone, string>>;
  tag: string;
  halo: string;
  selectedRing: string;
};

export type MapPointStyle = { colors: MapPointColors; fontFamily: string };

const LINED_TONES = ['danger', 'muted'] as const satisfies readonly MapPointTone[];
const FALLBACK_FONT_FAMILY = 'sans-serif';

// Canvas cannot read CSS variables, so the theme tokens are copied once before drawing.
export function readMapPointStyle(): MapPointStyle {
  const computed = getComputedStyle(document.documentElement);
  const read = (property: string) => computed.getPropertyValue(property).trim();
  const color = (name: string) => read(`--color-${name}`);
  const toneColors = (tone: MapPointTone): MapPointToneColors => ({
    fill: color(`tone-${tone}`),
    text: color(`tone-${tone}-foreground`),
  });

  return {
    colors: {
      tones: Object.fromEntries(MAP_POINT_TONES.map((tone) => [tone, toneColors(tone)])) as Record<
        MapPointTone,
        MapPointToneColors
      >,
      lines: Object.fromEntries(LINED_TONES.map((tone) => [tone, color(`tone-${tone}-line`)])),
      tag: color('tag'),
      halo: color('map-point-stroke'),
      selectedRing: color('map-point-selected-stroke'),
    },
    fontFamily: read('--font-sans') || FALLBACK_FONT_FAMILY,
  };
}
