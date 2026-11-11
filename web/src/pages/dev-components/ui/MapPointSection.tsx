import { useEffect, useRef, useState } from 'react';
import {
  drawMapPoint,
  MAP_POINT_TONES,
  type MapPointParams,
  type MapPointStyle,
  mapPointSize,
  readMapPointStyle,
} from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

const VALUE_FONT = '700 15px Inter';

const VALUES = {
  success: '12',
  warning: '3',
  danger: '0',
  neutral: '–',
  muted: '?',
  info: '7',
} as const satisfies Record<MapPointParams['tone'], string>;

type Case = [caption: string, params: MapPointParams];

const SQUARE: MapPointParams = { tone: 'neutral', shape: 'square', fill: 'tag', icon: 'bus' };
const SELECTED_SQUARE: MapPointParams = {
  tone: 'info',
  shape: 'square',
  icon: 'bus',
  selected: true,
};

// The value is drawn inside the image, so the font has to be there first, as on the map.
// Without the fonts API, or if the font fails, the point is drawn in the fallback font.
async function fontsReady() {
  await document.fonts?.load(VALUE_FONT);
}

type MapPointCanvasProps = { params: MapPointParams; style: MapPointStyle };

function MapPointCanvas({ params, style }: MapPointCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = mapPointSize(params);
  const pixelRatio = window.devicePixelRatio || 1;

  useEffect(() => {
    const draw = () => {
      const context = canvasRef.current?.getContext('2d');
      if (context) drawMapPoint(context, params, { pixelRatio, style });
    };
    void fontsReady().then(draw, draw);
  }, [params, pixelRatio, style]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      width={Math.ceil(size * pixelRatio)}
      height={Math.ceil(size * pixelRatio)}
      style={{ width: size, height: size }}
    />
  );
}

function specimensOf(style: MapPointStyle, cases: Case[]): Specimen[] {
  return cases.map(([caption, params]) => ({
    caption,
    piece: <MapPointCanvas params={params} style={style} />,
  }));
}

function valueCases(selected: boolean): Case[] {
  return MAP_POINT_TONES.map((tone) => [
    `${tone}${selected ? ' · seleccionado' : ''}`,
    { tone, value: VALUES[tone], selected },
  ]);
}

const CIRCLES = valueCases(false);
const SELECTED_CIRCLES = valueCases(true);
const SQUARES: Case[] = [
  ['neutral · fill="tag" · icon="bus"', SQUARE],
  ['info · seleccionado · icon="bus"', SELECTED_SQUARE],
];

export function MapPointSection() {
  const [style] = useState(readMapPointStyle);
  return (
    <ReviewSection title="MapPoint">
      <SpecimenRow title="Círculo con cifra" specimens={specimensOf(style, CIRCLES)} />
      <SpecimenRow title="Seleccionado" specimens={specimensOf(style, SELECTED_CIRCLES)} />
      <SpecimenRow title="Cuadrado con icono" specimens={specimensOf(style, SQUARES)} />
    </ReviewSection>
  );
}
