import { ICON_DRAWINGS, type IconName } from '../icons';
import type { MapPointParams } from './mapPointParams';
import type { MapPointColors, MapPointStyle } from './mapPointStyle';

const CIRCLE_DIAMETER_PX = 40;
const SELECTED_CIRCLE_SCALE = 1.2;
const SQUARE = { side: 32, radius: 8 };
const SELECTED_SQUARE = { side: 40, radius: 10 };
const BORDER_WIDTH_PX = 2;
const SELECTED_RING_WIDTH_PX = 4;
const ICON_SIZE_PX = 16;
const ICON_VIEWBOX_SIZE = 24;
const VALUE_SIZE_PX = 15;
const VALUE_WEIGHT = 700;
const FULL_TURN = 2 * Math.PI;

export type MapPointPainter = Pick<
  CanvasRenderingContext2D,
  | 'beginPath'
  | 'arc'
  | 'roundRect'
  | 'fill'
  | 'stroke'
  | 'fillText'
  | 'scale'
  | 'translate'
  | 'save'
  | 'restore'
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'lineCap'
  | 'lineJoin'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
>;

// The style is read once by the caller, so the drawing never touches the CSS.
export type MapPointDrawing = { pixelRatio: number; style: MapPointStyle };

type Shape = { isCircle: boolean; side: number; radius: number };

function shapeOf({ shape, selected }: MapPointParams): Shape {
  if (shape === 'square') return { isCircle: false, ...(selected ? SELECTED_SQUARE : SQUARE) };
  const side = selected ? CIRCLE_DIAMETER_PX * SELECTED_CIRCLE_SCALE : CIRCLE_DIAMETER_PX;
  return { isCircle: true, side, radius: side / 2 };
}

function borderWidthOf({ selected }: MapPointParams): number {
  return selected ? SELECTED_RING_WIDTH_PX : BORDER_WIDTH_PX;
}

// The selection wins over the tone's own line, so the selected point always looks the same.
function borderColorOf({ tone, selected }: MapPointParams, colors: MapPointColors): string {
  if (selected) return colors.selectedRing;
  return colors.lines[tone] ?? colors.halo;
}

function fillColorOf({ tone, fill }: MapPointParams, colors: MapPointColors): string {
  return fill === 'tag' ? colors.tag : colors.tones[tone].fill;
}

// The border sits outside the shape, as in the map's point images, so the image grows with it.
export function mapPointSize(params: MapPointParams): number {
  return shapeOf(params).side + 2 * borderWidthOf(params);
}

function traceShape(painter: MapPointPainter, params: MapPointParams) {
  const { isCircle, side, radius } = shapeOf(params);
  const inset = borderWidthOf(params) / 2;
  const pathSide = side + 2 * inset;
  painter.beginPath();
  if (isCircle) {
    const center = inset + pathSide / 2;
    painter.arc(center, center, pathSide / 2, 0, FULL_TURN);
    return;
  }
  painter.roundRect(inset, inset, pathSide, pathSide, radius + inset);
}

function paintShape(painter: MapPointPainter, params: MapPointParams, colors: MapPointColors) {
  traceShape(painter, params);
  painter.fillStyle = fillColorOf(params, colors);
  painter.fill();
  painter.lineWidth = borderWidthOf(params);
  painter.strokeStyle = borderColorOf(params, colors);
  painter.stroke();
}

type Label = { value: string; center: number; fontFamily: string };

function paintValue(painter: MapPointPainter, { value, center, fontFamily }: Label) {
  painter.font = `${VALUE_WEIGHT} ${VALUE_SIZE_PX}px ${fontFamily}`;
  painter.textAlign = 'center';
  painter.textBaseline = 'middle';
  painter.fillText(value, center, center);
}

// Same path data as Icon, scaled from its 24 viewBox, so the stroke width stays in its units.
function paintIcon(painter: MapPointPainter, icon: IconName, center: number) {
  const { paths, strokeWidth, isFilled } = ICON_DRAWINGS[icon];
  const corner = center - ICON_SIZE_PX / 2;
  const scale = ICON_SIZE_PX / ICON_VIEWBOX_SIZE;
  painter.save();
  painter.translate(corner, corner);
  painter.scale(scale, scale);
  painter.lineWidth = strokeWidth;
  painter.lineCap = 'round';
  painter.lineJoin = 'round';
  for (const d of paths) {
    const path = new Path2D(d);
    if (isFilled) painter.fill(path);
    painter.stroke(path);
  }
  painter.restore();
}

function paintContent(painter: MapPointPainter, params: MapPointParams, style: MapPointStyle) {
  const center = mapPointSize(params) / 2;
  const color = style.colors.tones[params.tone].text;
  painter.fillStyle = color;
  painter.strokeStyle = color;
  if (params.icon !== undefined) {
    paintIcon(painter, params.icon, center);
    return;
  }
  if (params.value === undefined) return;
  paintValue(painter, { value: params.value, center, fontFamily: style.fontFamily });
}

// The caller sizes the canvas to Math.ceil(mapPointSize(params) * pixelRatio) on each side.
export function drawMapPoint(
  painter: MapPointPainter,
  params: MapPointParams,
  { pixelRatio, style }: MapPointDrawing,
) {
  painter.scale(pixelRatio, pixelRatio);
  paintShape(painter, params, style.colors);
  paintContent(painter, params, style);
}
