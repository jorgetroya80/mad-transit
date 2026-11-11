import type { MouseEvent } from 'react';
import { Icon, type IconName } from '../icons';
import { Spinner } from '../spinner';

type ButtonTone = 'warning' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ColorScheme = 'primary' | 'secondary' | `outline-${ButtonTone}`;

// Outline has no drawing of its own: it takes the color of its tone.
export type ButtonLook =
  | { variant?: 'primary' | 'secondary'; tone?: never }
  | { variant: 'outline'; tone: ButtonTone };

type ButtonProps = ButtonLook & {
  label: string;
  onClick: () => void;
  size?: ButtonSize;
  icon?: IconName;
  busy?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
};

// sm is 40 high; the ::after stretches its hit area to 44 without changing the drawing.
const SIZE_CLASSES = {
  sm: 'h-10 px-3 rounded-chip text-meta font-semibold after:absolute after:inset-x-0 after:-inset-y-0.5',
  md: 'h-11 px-4 rounded-control text-body font-semibold',
  lg: 'h-12 px-6 rounded-card text-label',
} as const satisfies Record<ButtonSize, string>;

const COLOR_CLASSES = {
  primary: 'bg-primary text-primary-foreground border-primary',
  secondary: 'bg-surface text-primary border-primary',
  'outline-warning': 'bg-surface text-tone-warning-soft-foreground border-tone-warning-icon',
  'outline-danger': 'bg-surface text-tone-danger-soft-foreground border-tone-danger-icon',
} as const satisfies Record<ColorScheme, string>;

const INTERACTION_CLASSES = {
  primary:
    'hover:bg-primary-hover hover:border-primary-hover active:bg-primary-hover active:border-primary-hover',
  secondary: 'hover:bg-primary-soft active:bg-primary-soft-border',
  'outline-warning': 'hover:bg-tone-warning-soft active:bg-tone-warning-soft',
  'outline-danger': 'hover:bg-tone-danger-soft active:bg-tone-danger-soft',
} as const satisfies Record<ColorScheme, string>;

const DISABLED_CLASSES = 'bg-surface-disabled text-fg-muted border-line-strong';

const ICON_SIZE = 18;

function colorSchemeOf(look: ButtonLook): ColorScheme {
  return look.variant === 'outline' ? `outline-${look.tone}` : (look.variant ?? 'primary');
}

function stateClasses(scheme: ColorScheme, disabled: boolean, busy: boolean) {
  if (disabled) return DISABLED_CLASSES;
  if (busy) return COLOR_CLASSES[scheme];
  return `${COLOR_CLASSES[scheme]} ${INTERACTION_CLASSES[scheme]}`;
}

type LeadingIconProps = { icon?: IconName; busy: boolean; scheme: ColorScheme };

function LeadingIcon({ icon, busy, scheme }: LeadingIconProps) {
  if (busy) {
    const arcColor = scheme.startsWith('outline') ? 'text-primary' : '';
    return <Spinner size={ICON_SIZE} className={arcColor} />;
  }
  return icon ? <Icon name={icon} size={ICON_SIZE} /> : null;
}

// Busy keeps the button focusable (aria-disabled, not disabled) and swallows its presses.
export function Button({
  label,
  onClick,
  size = 'md',
  icon,
  busy = false,
  disabled = false,
  type = 'button',
  ...look
}: ButtonProps) {
  const scheme = colorSchemeOf(look);
  const isBusy = busy && !disabled;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isBusy) event.preventDefault();
    else onClick();
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      aria-busy={isBusy || undefined}
      aria-disabled={isBusy || undefined}
      className={`focus-ring relative inline-flex shrink-0 items-center justify-center gap-2 border whitespace-nowrap ${SIZE_CLASSES[size]} ${stateClasses(scheme, disabled, isBusy)}`}
    >
      <LeadingIcon icon={icon} busy={isBusy} scheme={scheme} />
      {label}
    </button>
  );
}
