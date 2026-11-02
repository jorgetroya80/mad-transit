import type { MapColors } from './mapColors';
import type { PointImageSpec } from './points';

const POINT_RADIUS_PX = 20;
const SELECTED_POINT_RADIUS_PX = 24;
const POINT_STROKE_WIDTH_PX = 1.5;
const SELECTED_POINT_STROKE_WIDTH_PX = 3;
// The empty tone is filled white like the map, so its border has to be visible.
const EMPTY_POINT_STROKE_WIDTH_PX = 2;
const LABEL_SIZE_PX = 14;
const LABEL_WEIGHT = 700;
const FULL_TURN = 2 * Math.PI;

export type PointStyle = { colors: MapColors; fontFamily: string };

export type PointPainter = Pick<
  CanvasRenderingContext2D,
  | 'beginPath'
  | 'arc'
  | 'fill'
  | 'stroke'
  | 'fillText'
  | 'scale'
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
>;

type Ring = { radius: number; strokeWidth: number };

export function labelFont({ fontFamily }: PointStyle): string {
  return `${LABEL_WEIGHT} ${LABEL_SIZE_PX}px ${fontFamily}`;
}

function ringOf({ tone, selected }: PointImageSpec): Ring {
  if (selected)
    return { radius: SELECTED_POINT_RADIUS_PX, strokeWidth: SELECTED_POINT_STROKE_WIDTH_PX };
  if (tone === 'empty')
    return { radius: POINT_RADIUS_PX, strokeWidth: EMPTY_POINT_STROKE_WIDTH_PX };
  return { radius: POINT_RADIUS_PX, strokeWidth: POINT_STROKE_WIDTH_PX };
}

// The selection wins over the empty tone's border, so the selected point always looks the same.
function strokeColorOf({ tone, selected }: PointImageSpec, colors: MapColors): string {
  if (selected) return colors.pointSelectedStroke;
  return tone === 'empty' ? colors.emptyStroke : colors.pointStroke;
}

// The ring sits outside the circle, as MapLibre's circle stroke did, so the image grows with it.
function imageSizeOf({ radius, strokeWidth }: Ring): number {
  return 2 * (radius + strokeWidth);
}

export function paintPoint(painter: PointPainter, spec: PointImageSpec, style: PointStyle) {
  const ring = ringOf(spec);
  const center = imageSizeOf(ring) / 2;
  const toneColors = style.colors.tones[spec.tone];

  painter.beginPath();
  painter.arc(center, center, ring.radius + ring.strokeWidth / 2, 0, FULL_TURN);
  painter.fillStyle = toneColors.fill;
  painter.fill();
  painter.lineWidth = ring.strokeWidth;
  painter.strokeStyle = strokeColorOf(spec, style.colors);
  painter.stroke();

  painter.font = labelFont(style);
  painter.textAlign = 'center';
  painter.textBaseline = 'middle';
  painter.fillStyle = toneColors.text;
  painter.fillText(spec.label, center, center);
}

export function createPointImage(
  spec: PointImageSpec,
  style: PointStyle,
  pixelRatio: number,
): ImageData | undefined {
  const size = Math.ceil(imageSizeOf(ringOf(spec)) * pixelRatio);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  context.scale(pixelRatio, pixelRatio);
  paintPoint(context, spec, style);
  return context.getImageData(0, 0, size, size);
}
