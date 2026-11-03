import type { ReactNode } from 'react';
import { InfoIcon, OfflineIcon, WarningIcon } from '../icons';

type StatusBannerVariant = 'info' | 'stale' | 'offline';

// A pending action says so in its label and stays focusable (aria-disabled, not disabled).
type StatusBannerAction = { label: string; onClick: () => void; isPending?: boolean };

type BannerIcon = typeof InfoIcon;

type StatusBannerProps = {
  variant: StatusBannerVariant;
  children: ReactNode;
  action?: StatusBannerAction;
  // Replaces the variant's icon when the notice is about something more specific.
  icon?: BannerIcon;
};

// `status` is announced politely when it appears; losing the connection interrupts (`alert`).
// Info reuses the primary tokens, as the design canvas does.
const VARIANTS = {
  info: {
    role: 'status',
    Icon: InfoIcon,
    className: 'border border-primary-soft-border bg-primary-soft text-fg',
    iconClassName: 'text-primary',
  },
  stale: {
    role: 'status',
    Icon: WarningIcon,
    className: 'border border-notice-stale-line bg-notice-stale text-notice-stale-foreground',
    iconClassName: 'text-notice-stale-icon',
  },
  offline: {
    role: 'alert',
    Icon: OfflineIcon,
    className: 'bg-notice-offline text-notice-offline-foreground',
    iconClassName: '',
  },
} as const satisfies Record<
  StatusBannerVariant,
  { role: 'status' | 'alert'; Icon: BannerIcon; className: string; iconClassName: string }
>;

function ActionButton({ label, onClick, isPending = false }: StatusBannerAction) {
  return (
    <button
      type="button"
      aria-busy={isPending || undefined}
      aria-disabled={isPending || undefined}
      onClick={isPending ? undefined : onClick}
      className="ml-auto min-h-11 shrink-0 rounded-control px-3 font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current aria-disabled:cursor-wait"
    >
      {label}
    </button>
  );
}

export function StatusBanner({ variant, children, action, icon }: StatusBannerProps) {
  const { role, Icon: variantIcon, className, iconClassName } = VARIANTS[variant];
  const Icon = icon ?? variantIcon;
  return (
    <div role={role} className={`flex items-center gap-2 rounded-card p-3 text-sm ${className}`}>
      <Icon className={`size-5 shrink-0 ${iconClassName}`} />
      <p>{children}</p>
      {action ? <ActionButton {...action} /> : null}
    </div>
  );
}
