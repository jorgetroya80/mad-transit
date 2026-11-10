import { type ReactNode, useId } from 'react';
import { Icon, type IconName, type IconSize } from '../icons';
import { Spinner } from '../spinner';

type SegmentedVariant = 'tray' | 'cards' | 'pill';
type PillEmphasis = 'soft' | 'solid';
type ColorScheme = 'tray' | 'cards' | `pill-${PillEmphasis}`;
type SegmentState = 'normal' | 'selected' | 'disabled' | 'disabledSelected';

type SegmentedOption<V extends string> = {
  value: V;
  label: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
};

type SegmentedControlProps<V extends string> = {
  label: string;
  labelVisible?: boolean;
  // Two to four options.
  options: readonly SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  variant?: SegmentedVariant;
  // Only pill: how the chosen option is marked.
  emphasis?: PillEmphasis;
  busyValue?: V;
  disabled?: boolean;
};

const CONTAINER_CLASSES = {
  tray: 'grid auto-cols-fr grid-flow-col gap-1 rounded-card bg-chip p-1',
  cards: 'grid grid-cols-2 gap-2',
  pill: 'inline-flex gap-1 rounded-full bg-surface p-1 shadow-pill',
} as const satisfies Record<SegmentedVariant, string>;

// pill is 40 high; the ::after stretches its hit area to 44 inside the tray padding.
const LAYOUT_CLASSES = {
  tray: 'h-11 justify-center gap-2 rounded-segment px-4.5 text-label',
  cards: 'min-h-14 gap-2.5 rounded-card border-2 px-3 py-2 text-left',
  pill: 'h-10 gap-1 rounded-full px-3 text-meta font-semibold whitespace-nowrap after:absolute after:inset-x-0 after:-inset-y-0.5',
} as const satisfies Record<SegmentedVariant, string>;

const PILL_UNSELECTED = {
  normal: 'bg-transparent text-fg hover:bg-chip active:bg-line',
  disabled: 'bg-transparent text-fg-muted',
  disabledSelected: 'bg-chip text-fg-muted',
} as const;

const STATE_CLASSES = {
  tray: {
    normal: 'bg-transparent text-fg hover:bg-line active:bg-line-strong',
    selected: 'bg-surface text-primary shadow-segment font-bold',
    disabled: 'bg-transparent text-fg-muted',
    disabledSelected: 'bg-surface text-fg-muted shadow-segment font-bold',
  },
  cards: {
    normal: 'bg-surface border-line-strong text-fg hover:bg-chip active:bg-line',
    selected:
      'bg-primary border-primary text-primary-foreground hover:bg-primary-hover hover:border-primary-hover active:bg-primary-hover active:border-primary-hover',
    disabled: 'bg-surface-disabled border-line-strong text-fg-muted',
    disabledSelected: 'bg-surface-disabled border-line-strong text-fg-muted',
  },
  'pill-soft': {
    ...PILL_UNSELECTED,
    selected: 'bg-primary-soft text-primary inset-ring-2 inset-ring-primary',
  },
  'pill-solid': {
    ...PILL_UNSELECTED,
    selected: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
  },
} as const satisfies Record<ColorScheme, Record<SegmentState, string>>;

const ICON_SIZES = {
  tray: 20,
  cards: 22,
  pill: 16,
} as const satisfies Record<SegmentedVariant, IconSize>;

function segmentStateOf(isSelected: boolean, isDisabled: boolean): SegmentState {
  if (isDisabled) return isSelected ? 'disabledSelected' : 'disabled';
  return isSelected ? 'selected' : 'normal';
}

type GroupFrameProps = { label: string; labelVisible: boolean; children: ReactNode };

// A fieldset either way, since oxlint rejects role="group": with a hidden label it is named by
// aria-label instead of a legend.
function GroupFrame({ label, labelVisible, children }: GroupFrameProps) {
  return (
    <fieldset aria-label={labelVisible ? undefined : label} className="m-0 min-w-0 border-0 p-0">
      {labelVisible && <legend className="mb-1.5 text-body font-semibold text-fg">{label}</legend>}
      {children}
    </fieldset>
  );
}

type SegmentProps<V extends string> = {
  option: SegmentedOption<V>;
  isSelected: boolean;
  isBusy: boolean;
  isDisabled: boolean;
  variant: SegmentedVariant;
  scheme: ColorScheme;
  onPress: () => void;
};

function LeadingIcon({ icon, isBusy, size }: { icon?: IconName; isBusy: boolean; size: IconSize }) {
  if (isBusy) return <Spinner size={size} />;
  return icon ? <Icon name={icon} size={size} /> : null;
}

// The description is hidden from the name so the segment is named by its label alone, and it
// reaches assistive technology through aria-describedby.
function Segment<V extends string>(props: SegmentProps<V>) {
  const { option, isSelected, isBusy, isDisabled, variant, scheme, onPress } = props;
  const descriptionId = useId();
  const hasDescription = variant === 'cards' && option.description !== undefined;
  const state = segmentStateOf(isSelected, isDisabled);

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-busy={isBusy || undefined}
      aria-describedby={hasDescription ? descriptionId : undefined}
      disabled={isDisabled}
      onClick={onPress}
      className={`focus-ring relative inline-flex items-center ${LAYOUT_CLASSES[variant]} ${STATE_CLASSES[scheme][state]}`}
    >
      <LeadingIcon icon={option.icon} isBusy={isBusy} size={ICON_SIZES[variant]} />
      {variant === 'cards' ? (
        <span className="flex flex-col">
          <span className="text-label">{option.label}</span>
          {hasDescription && (
            <span
              id={descriptionId}
              aria-hidden="true"
              className="text-caption font-normal opacity-85"
            >
              {option.description}
            </span>
          )}
        </span>
      ) : (
        option.label
      )}
    </button>
  );
}

// Toggle buttons, not radios: Tab goes through every segment and Enter or Space chooses one.
export function SegmentedControl<V extends string>({
  label,
  labelVisible = false,
  options,
  value,
  onChange,
  variant = 'tray',
  emphasis = 'soft',
  busyValue,
  disabled = false,
}: SegmentedControlProps<V>) {
  const scheme: ColorScheme = variant === 'pill' ? `pill-${emphasis}` : variant;

  return (
    <GroupFrame label={label} labelVisible={labelVisible}>
      <div className={CONTAINER_CLASSES[variant]}>
        {options.map((option) => (
          <Segment
            key={option.value}
            option={option}
            isSelected={option.value === value}
            isBusy={option.value === busyValue}
            isDisabled={disabled || option.disabled === true}
            variant={variant}
            scheme={scheme}
            onPress={() => {
              if (option.value !== value) onChange(option.value);
            }}
          />
        ))}
      </div>
    </GroupFrame>
  );
}
