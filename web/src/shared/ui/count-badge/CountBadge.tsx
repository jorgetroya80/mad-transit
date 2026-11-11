import { LINE_STYLE_CLASSES, type Tone, toneLineStyle } from '../tone';

type BadgeTone = Exclude<Tone, 'inverse'>;
type BadgeSize = 'md' | 'sm';

type CountBadgeProps = {
  value: string;
  tone: BadgeTone;
  size?: BadgeSize;
  srText?: string;
  loading?: boolean;
};

const BADGE_TONE = {
  success: 'bg-tone-success text-tone-success-foreground border-tone-success',
  warning: 'bg-tone-warning text-tone-warning-foreground border-tone-warning',
  danger: 'bg-surface text-tone-danger-foreground border-tone-danger-line',
  neutral: 'bg-tone-neutral text-tone-neutral-foreground border-tone-neutral',
  muted: 'bg-tone-muted text-tone-muted-foreground border-tone-muted-line',
  info: 'bg-tone-info text-tone-info-foreground border-tone-info',
} as const satisfies Record<BadgeTone, string>;

const BADGE_BOX = {
  md: 'h-8 min-w-11',
  sm: 'h-7.5 min-w-10',
} as const satisfies Record<BadgeSize, string>;

const BADGE_FIGURE = {
  md: 'text-base',
  sm: 'text-label',
} as const satisfies Record<BadgeSize, string>;

const BADGE_BASE =
  'inline-flex shrink-0 items-center justify-center box-border rounded-full border-2 px-2 font-bold tabular-nums';

// Without srText the whole badge is hidden: the row it sits in already says the count.
export function CountBadge({ value, tone, size = 'md', srText, loading = false }: CountBadgeProps) {
  if (loading) {
    return (
      <span aria-hidden="true" className={`inline-block rounded-full bg-chip ${BADGE_BOX[size]}`} />
    );
  }
  const toneClasses = `${BADGE_TONE[tone]} ${LINE_STYLE_CLASSES[toneLineStyle[tone]]}`;
  return (
    <span
      aria-hidden={srText ? undefined : true}
      className={`${BADGE_BASE} ${BADGE_BOX[size]} ${BADGE_FIGURE[size]} ${toneClasses}`}
    >
      <span aria-hidden={srText ? true : undefined}>{value}</span>
      {srText ? <span className="sr-only">{srText}</span> : null}
    </span>
  );
}
