import type { MouseEvent } from 'react';
import { Icon, type IconName, type IconSize } from '../icons';
import { Spinner } from '../spinner';

type IconButtonVariant = 'ghost' | 'outline' | 'floating';
type IconButtonSize = 'sm' | 'md' | 'lg';
type IconTone = 'neutral' | 'primary';

type IconButtonProps = {
  label: string;
  icon: IconName;
  onClick: () => void;
  pressed?: boolean;
  pressedIcon?: IconName;
  iconSize?: IconSize;
  variant?: IconButtonVariant;
  iconTone?: IconTone;
  size?: IconButtonSize;
  tooltip?: string;
  busy?: boolean;
  disabled?: boolean;
};

// sm is drawn at 40 px for tight spots and keeps a 44 px hit area.
const SIZE_CLASSES = {
  sm: 'size-10 rounded-control after:absolute after:-inset-0.5',
  md: 'size-11 rounded-control',
  lg: 'size-12 rounded-full',
} as const satisfies Record<IconButtonSize, string>;

const SURFACE_CLASSES = {
  ghost: 'bg-transparent',
  outline: 'bg-surface border border-line-subtle',
  floating: 'bg-surface',
} as const satisfies Record<IconButtonVariant, string>;

const DISABLED_SURFACE_CLASSES = {
  ghost: 'bg-transparent',
  outline: 'bg-surface-disabled border border-line-subtle',
  floating: 'bg-surface-disabled',
} as const satisfies Record<IconButtonVariant, string>;

const ICON_TONE_CLASSES = {
  neutral: 'text-fg-muted',
  primary: 'text-primary',
} as const satisfies Record<IconTone, string>;

const INTERACTION_CLASSES = 'hover:bg-chip active:bg-line';

// The star is drawn larger than the other icons.
const LARGE_ICONS: readonly IconName[] = ['star', 'star-filled'];

function iconSizeOf(icon: IconName): IconSize {
  return LARGE_ICONS.includes(icon) ? 24 : 20;
}

function shadowOf(variant: IconButtonVariant, size: IconButtonSize) {
  if (variant !== 'floating') return '';
  return size === 'lg' ? 'shadow-pill' : 'shadow-control';
}

type ButtonState = { isPressed: boolean; isBusy: boolean; isDisabled: boolean };

function iconColorOf(iconTone: IconTone, { isPressed, isDisabled }: ButtonState) {
  if (isDisabled) return 'text-handle';
  return isPressed ? 'text-primary' : ICON_TONE_CLASSES[iconTone];
}

function surfaceOf(variant: IconButtonVariant, { isBusy, isDisabled }: ButtonState) {
  if (isDisabled) return DISABLED_SURFACE_CLASSES[variant];
  if (isBusy) return SURFACE_CLASSES[variant];
  return `${SURFACE_CLASSES[variant]} ${INTERACTION_CLASSES}`;
}

function classesOf(
  { variant = 'ghost', iconTone = 'neutral', size = 'md' }: IconButtonProps,
  state: ButtonState,
) {
  return [
    'focus-ring relative inline-flex shrink-0 items-center justify-center',
    SIZE_CLASSES[size],
    shadowOf(variant, size),
    surfaceOf(variant, state),
    iconColorOf(iconTone, state),
  ].join(' ');
}

function ButtonIcon({
  icon,
  pressedIcon = icon,
  iconSize,
  isPressed,
  isBusy,
}: IconButtonProps & ButtonState) {
  if (isBusy) return <Spinner className="text-primary" />;
  const shownIcon = isPressed ? pressedIcon : icon;
  return <Icon name={shownIcon} size={iconSize ?? iconSizeOf(shownIcon)} />;
}

// The label names the action and never changes: aria-pressed says the state, and the
// tooltip only sets the title.
export function IconButton(props: IconButtonProps) {
  const { label, onClick, pressed, tooltip, busy = false, disabled = false } = props;
  const state = { isPressed: pressed === true, isBusy: busy && !disabled, isDisabled: disabled };

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (state.isBusy) event.preventDefault();
    else onClick();
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      aria-busy={state.isBusy || undefined}
      aria-disabled={state.isBusy || undefined}
      title={tooltip}
      disabled={disabled}
      onClick={handleClick}
      className={classesOf(props, state)}
    >
      <ButtonIcon {...props} {...state} />
    </button>
  );
}
