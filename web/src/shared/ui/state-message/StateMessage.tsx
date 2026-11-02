import type { ReactNode } from 'react';
import { WarningIcon } from '../icons';

type StateMessageVariant = 'empty' | 'error' | 'loading';

type StateMessageProps = {
  variant: StateMessageVariant;
  title: string;
  children?: ReactNode;
};

// One entry per variant: a new state is a new entry, not a new branch in the component. The error
// is framed like the status banners (tinted, thin border all round, icon).
const VARIANTS = {
  empty: {
    role: 'status',
    busy: undefined,
    className: 'border-l-4 border-line-strong bg-surface text-fg-muted',
    hasIcon: false,
  },
  error: {
    role: 'alert',
    busy: undefined,
    className:
      'border border-notice-error-foreground/30 bg-notice-error text-notice-error-foreground',
    hasIcon: true,
  },
  loading: {
    role: 'status',
    busy: true,
    className: 'border-l-4 border-primary bg-surface text-primary',
    hasIcon: false,
  },
} as const satisfies Record<
  StateMessageVariant,
  { role: 'status' | 'alert'; busy: true | undefined; className: string; hasIcon: boolean }
>;

export function StateMessage({ variant, title, children }: StateMessageProps) {
  const { role, busy, className, hasIcon } = VARIANTS[variant];
  return (
    <div role={role} aria-busy={busy} className={`flex gap-2 rounded-card p-4 ${className}`}>
      {hasIcon ? <WarningIcon className="size-5 shrink-0" /> : null}
      <div>
        <p className="font-medium">{title}</p>
        {children ? <div className="mt-1 text-sm">{children}</div> : null}
      </div>
    </div>
  );
}
