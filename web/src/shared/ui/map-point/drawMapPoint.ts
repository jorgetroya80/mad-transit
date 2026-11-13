import { ICON_DRAWINGS, type IconName } from '../icons';
import type { MapPointParams } from './mapPointParams';
import type { MapPointColors, MapPointStyle } from './mapPointStyle';

const CIRCLE_DIAMETER_PX = 40;
const SELECTED_CIRCLE_SCALE = 1.2;
const SQUARE = { side: 32, radius: 8 };
const SELECTED_SQUARE = { side: 40, radius: 10 };
const PILL = { width: 72, height: 32 };
const PILL_ICON_OFFSET_PX = 18;
const PILL_VALUE_OFFSET_PX = 8;
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

type Shape = { isCircle: boolean; width: number; height: number; radius: number };

function shapeOf({ shape, selected }: MapPointParams): Shape {
  if (shape === 'pill') return { isCircle: false, ...PILL, radius: PILL.height / 2 };
  if (shape === 'square') {
    const { side, radius } = selected ? SELECTED_SQUARE : SQUARE;
    return { isCircle: false, width: side, height: side, radius };
  }
  const side = selected ? CIRCLE_DIAMETER_PX * SELECTED_CIRCLE_SCALE : CIRCLE_DIAMETER_PX;
  return { isCircle: true, width: side, height: side, radius: side / 2 };
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
// The image stays square: a pill is drawn across its middle.
export function mapPointSize(params: MapPointParams): number {
  const { width, height } = shapeOf(params);
  return Math.max(width, height) + 2 * borderWidthOf(params);
}

function traceShape(painter: MapPointPainter, params: MapPointParams) {
  const { isCircle, width, height, radius } = shapeOf(params);
  const inset = borderWidthOf(params) / 2;
  const center = mapPointSize(params) / 2;
  const halfWidth = width / 2 + inset;
  const halfHeight = height / 2 + inset;
  painter.beginPath();
  if (isCircle) {
    painter.arc(center, center, halfWidth, 0, FULL_TURN);
    return;
  }
  painter.roundRect(
    center - halfWidth,
    center - halfHeight,
    2 * halfWidth,
    2 * halfHeight,
    radius + inset,
  );
}

function paintShape(painter: MapPointPainter, params: MapPointParams, colors: MapPointColors) {
  traceShape(painter, params);
  painter.fillStyle = fillColorOf(params, colors);
  painter.fill();
  painter.lineWidth = borderWidthOf(params);
  painter.strokeStyle = borderColorOf(params, colors);
  painter.stroke();
}

// The value is drawn inside the image, so the caller waits for this font before drawing.
export function mapPointValueFont({ fontFamily }: MapPointStyle): string {
  return `${VALUE_WEIGHT} ${VALUE_SIZE_PX}px ${fontFamily}`;
}

type Point = { x: number; y: number };
type Label = Point & { value: string; style: MapPointStyle };

function paintValue(painter: MapPointPainter, { value, x, y, style }: Label) {
  painter.font = mapPointValueFont(style);
  painter.textAlign = 'center';
  painter.textBaseline = 'middle';
  painter.fillText(value, x, y);
}

// Same path data as Icon, scaled from its 24 viewBox, so the stroke width stays in its units.
function paintIcon(painter: MapPointPainter, icon: IconName, { x, y }: Point) {
  const { paths, strokeWidth, isFilled } = ICON_DRAWINGS[icon];
  const scale = ICON_SIZE_PX / ICON_VIEWBOX_SIZE;
  painter.save();
  painter.translate(x - ICON_SIZE_PX / 2, y - ICON_SIZE_PX / 2);
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
  if (params.shape === 'pill') {
    paintIcon(painter, params.icon, { x: center - PILL_ICON_OFFSET_PX, y: center });
    paintValue(painter, {
      value: params.value,
      x: center + PILL_VALUE_OFFSET_PX,
      y: center,
      style,
    });
    return;
  }
  if (params.icon !== undefined) {
    paintIcon(painter, params.icon, { x: center, y: center });
    return;
  }
  if (params.value === undefined) return;
  paintValue(painter, { value: params.value, x: center, y: center, style });
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
