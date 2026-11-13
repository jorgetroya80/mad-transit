import type { IconName } from '../icons';
import { TONES, type Tone } from '../tone';

export type MapPointTone = Exclude<Tone, 'inverse'>;

export const MAP_POINT_TONES = TONES.filter((tone): tone is MapPointTone => tone !== 'inverse');

// The tag fill is dark, so only the tones with a white value keep it readable.
export const MAP_POINT_TAG_TONES = [
  'success',
  'neutral',
  'info',
] as const satisfies readonly MapPointTone[];

type MapPointTagTone = (typeof MAP_POINT_TAG_TONES)[number];

export type MapPointShape = 'circle' | 'square' | 'pill';

export type MapPointFill = 'tone' | 'tag';

type MapPointContent =
  | { value: string; icon?: never }
  | { icon: IconName; value?: never }
  | { value?: never; icon?: never };

type MapPointLook = { tone: MapPointTone; fill?: 'tone' } | { tone: MapPointTagTone; fill: 'tag' };

// A pill is the only shape that carries its icon and its value together.
type MapPointBody =
  | ({ shape?: Exclude<MapPointShape, 'pill'> } & MapPointContent)
  | { shape: 'pill'; icon: IconName; value: string };

export type MapPointParams = MapPointLook & { selected?: boolean } & MapPointBody;

const ID_PREFIX = 'map-point';

function contentKey({ value, icon }: MapPointParams): string {
  if (icon !== undefined && value !== undefined) return `icon=${icon}:value=${value}`;
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
