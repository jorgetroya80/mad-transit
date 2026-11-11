import { type ReactNode, useId } from 'react';
import { Spinner } from '../spinner';
import type { Tone } from '../tone';

type Density = 'md' | 'sm';
type CaptionTone = Exclude<Tone, 'inverse'>;

type TrailingCaption = { text: string; tone: CaptionTone };

type ListItemContent = {
  title: string;
  subtitle?: string;
  leadingText?: string;
  leading?: ReactNode;
  below?: ReactNode;
  trailing?: ReactNode;
  trailingCaption?: TrailingCaption;
  selected?: boolean;
  disabled?: boolean;
  density?: Density;
};

// The visible text is spread over slots, so a selectable row needs one sentence to be read.
type Selection =
  | { onSelect: () => void; accessibleLabel: string }
  | { onSelect?: never; accessibleLabel?: never };

// aria-busy is not announced, so a busy row says what it waits for.
type Busy = { busy: boolean; busyLabel: string } | { busy?: false; busyLabel?: never };

type ListItemProps = ListItemContent & Selection & Busy;

type RowState = {
  isSelected: boolean;
  isDisabled: boolean;
  isSelectable: boolean;
  isBusy: boolean;
};

const PADDING = {
  md: 'p-2.5',
  sm: 'p-2',
} as const satisfies Record<Density, string>;

const LEADING_BOX_SIZE = {
  md: 'h-8 min-w-11',
  sm: 'h-7.5 min-w-10',
} as const satisfies Record<Density, string>;

const CAPTION_COLOR = {
  success: 'text-tone-success-label',
  warning: 'text-tone-warning-label',
  danger: 'text-tone-danger-label',
  neutral: 'text-tone-neutral-label',
  muted: 'text-tone-muted-label',
  info: 'text-tone-info-label',
} as const satisfies Record<CaptionTone, string>;

const ROW_BASE = 'flex min-h-16 w-full items-center gap-3 rounded-control border-2 text-left';

const LEADING_BOX_BASE =
  'inline-flex shrink-0 items-center justify-center rounded-chip px-1.5 text-body font-bold text-tone-neutral-soft-foreground tabular-nums';

function surfaceOf({ isSelected, isDisabled, isSelectable, isBusy }: RowState) {
  if (isSelected) return 'bg-primary-soft border-primary';
  if (isDisabled || isBusy || !isSelectable) return 'bg-transparent border-transparent';
  return 'bg-transparent border-transparent hover:bg-chip active:bg-line';
}

function rowClasses(density: Density, state: RowState) {
  const focusRing = state.isSelectable ? 'focus-ring' : '';
  return `${ROW_BASE} ${PADDING[density]} ${surfaceOf(state)} ${focusRing}`;
}

type LeadingProps = Pick<ListItemContent, 'leading' | 'leadingText'> & {
  density: Density;
  isSelected: boolean;
};

function Leading({ leading, leadingText, density, isSelected }: LeadingProps) {
  if (leading) return leading;
  if (!leadingText) return null;
  const fill = isSelected ? 'bg-surface' : 'bg-chip';
  return (
    <span className={`${LEADING_BOX_BASE} ${LEADING_BOX_SIZE[density]} ${fill}`}>
      {leadingText}
    </span>
  );
}

type TextProps = Pick<ListItemContent, 'title' | 'subtitle' | 'below'> & { isDisabled: boolean };

function Text({ title, subtitle, below, isDisabled }: TextProps) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className={`text-label break-words ${isDisabled ? 'text-fg-muted' : 'text-fg'}`}>
        {title}
      </span>
      {subtitle ? <span className="text-meta text-fg-muted">{subtitle}</span> : null}
      {below ? <span className="mt-0.75">{below}</span> : null}
    </span>
  );
}

type TrailingProps = Pick<ListItemContent, 'trailing' | 'trailingCaption'> & {
  busyLabel?: string;
  busyLabelId: string;
};

function Trailing({ trailing, trailingCaption, busyLabel, busyLabelId }: TrailingProps) {
  if (busyLabel !== undefined) {
    return (
      <span className="flex shrink-0 items-center">
        <Spinner className="text-primary" />
        <span id={busyLabelId} className="sr-only">
          {busyLabel}
        </span>
      </span>
    );
  }
  if (!trailing && !trailingCaption) return null;
  return (
    <span className="flex shrink-0 flex-col items-end gap-0.5">
      {trailing}
      {trailingCaption ? (
        <span className={`text-caption ${CAPTION_COLOR[trailingCaption.tone]}`}>
          {trailingCaption.text}
        </span>
      ) : null}
    </span>
  );
}

// Disabled wins over busy, as in Button.
function rowStateOf({ selected, disabled, onSelect, busy }: ListItemProps): RowState {
  return {
    isSelected: selected === true,
    isDisabled: disabled === true,
    isSelectable: onSelect !== undefined,
    isBusy: busy === true && disabled !== true,
  };
}

// The caller renders the <li>. Without onSelect the row is a plain div, so its trailing slot can
// hold a button of its own without nesting buttons.
export function ListItem(props: ListItemProps) {
  const { onSelect, accessibleLabel, busyLabel, density = 'md' } = props;
  const busyLabelId = useId();
  const state = rowStateOf(props);
  const busy = state.isBusy;
  const content = (
    <>
      <Leading {...props} density={density} isSelected={state.isSelected} />
      <Text {...props} isDisabled={state.isDisabled} />
      <Trailing {...props} busyLabel={busy ? busyLabel : undefined} busyLabelId={busyLabelId} />
    </>
  );
  const shared = {
    'aria-current': state.isSelected || undefined,
    'aria-busy': busy || undefined,
    className: rowClasses(density, state),
  };

  if (!onSelect) return <div {...shared}>{content}</div>;
  // A busy row keeps the focus (aria-disabled, not disabled) and ignores presses, like Button.
  return (
    <button
      type="button"
      {...shared}
      aria-label={accessibleLabel}
      aria-describedby={busy ? busyLabelId : undefined}
      aria-disabled={busy || undefined}
      disabled={state.isDisabled}
      onClick={busy ? undefined : onSelect}
    >
      {content}
    </button>
  );
}
