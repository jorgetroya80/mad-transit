import type { IconName } from '../icons';
import { TONES, type Tone } from '../tone';

export type MapPointTone = Exclude<Tone, 'inverse'>;

export const MAP_POINT_TONES = TONES.filter((tone): tone is MapPointTone => tone !== 'inverse');

export type MapPointShape = 'circle' | 'square';

export type MapPointFill = 'tone' | 'tag';

type MapPointContent =
  | { value: string; icon?: never }
  | { icon: IconName; value?: never }
  | { value?: never; icon?: never };

export type MapPointParams = {
  tone: MapPointTone;
  shape?: MapPointShape;
  fill?: MapPointFill;
  selected?: boolean;
} & MapPointContent;

const ID_PREFIX = 'map-point';

function contentKey({ value, icon }: MapPointParams): string {
  if (icon !== undefined) return `icon=${icon}`;
  if (value !== undefined) return `value=${value}`;
  return 'empty';
}

// The value goes last, so no text it may hold can make two points share an id.
export function mapPointImageId(params: MapPointParams): string {
  const { tone, shape = 'circle', fill = 'tone', selected = false } = params;
  const state = selected ? 'selected' : 'normal';
  return [ID_PREFIX, tone, shape, fill, state, contentKey(params)].join(':');
}
