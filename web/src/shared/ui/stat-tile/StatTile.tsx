import { LINE_STYLE_CLASSES, type Tone, toneLineStyle } from '../tone';

type TileTone = Exclude<Tone, 'inverse'>;

type StatTileProps = {
  value: string;
  label: string;
  tone: TileTone;
  statusLabel?: string;
  srText?: string;
  loading?: boolean;
};

type TileToneClasses = { box: string; value: string; status: string };

// Data pieces keep danger on the surface: the pink fill belongs to the notices.
const TILE_TONE = {
  success: {
    box: 'bg-tone-success-soft border-tone-success-line',
    value: 'text-tone-success-label',
    status: 'text-tone-success-label',
  },
  warning: {
    box: 'bg-tone-warning-soft border-tone-warning-line',
    value: 'text-tone-warning-foreground',
    status: 'text-tone-warning-label',
  },
  danger: {
    box: 'bg-surface border-tone-danger-line',
    value: 'text-tone-danger-label',
    status: 'text-tone-danger-label',
  },
  neutral: {
    box: 'bg-tone-neutral-soft border-tone-neutral-soft',
    value: 'text-tone-neutral-soft-foreground',
    status: 'text-tone-neutral-label',
  },
  muted: {
    box: 'bg-tone-muted border-tone-muted-line',
    value: 'text-tone-muted-foreground',
    status: 'text-tone-muted-label',
  },
  info: {
    box: 'bg-tone-info-soft border-tone-info-line',
    value: 'text-tone-info-label',
    status: 'text-tone-info-label',
  },
} as const satisfies Record<TileTone, TileToneClasses>;

const TILE_BASE =
  'flex flex-col items-center gap-0.5 text-center box-border rounded-control border-2 px-3 py-2.5';

// The height of a tile with a value and a label, so nothing moves when the data arrives.
const LOADING_TILE = 'h-19 rounded-control bg-chip';

export function StatTile({
  value,
  label,
  tone,
  statusLabel,
  srText,
  loading = false,
}: StatTileProps) {
  if (loading) return <div aria-hidden="true" className={LOADING_TILE} />;
  const classes = TILE_TONE[tone];
  const drawnOnly = srText ? true : undefined;
  return (
    <div className={`${TILE_BASE} ${classes.box} ${LINE_STYLE_CLASSES[toneLineStyle[tone]]}`}>
      <span aria-hidden={drawnOnly} className={`text-stat tabular-nums ${classes.value}`}>
        {value}
      </span>
      <span aria-hidden={drawnOnly} className="text-meta text-fg">
        {label}
      </span>
      {statusLabel ? (
        <span aria-hidden={drawnOnly} className={`text-caption font-bold ${classes.status}`}>
          {statusLabel}
        </span>
      ) : null}
      {srText ? <span className="sr-only">{srText}</span> : null}
    </div>
  );
}
