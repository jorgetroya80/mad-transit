import type { ReactNode } from 'react';
import { usePendingAction } from '@/shared/lib';
import { RefreshIcon, type WarningIcon } from '../icons';

type ErrorStateTone = 'error' | 'neutral';

// A returned promise keeps the button busy until it settles.
type ErrorStateAction = { label: string; onAction: () => unknown };

type ErrorStateProps = {
  tone: ErrorStateTone;
  icon: typeof WarningIcon;
  title: string;
  body: string;
  action?: ErrorStateAction;
  // Outside the alert and never live: a countdown here would be read again every second.
  footer?: ReactNode;
};

const TONES = {
  error: 'bg-notice-error text-notice-error-foreground',
  neutral: 'bg-chip text-fg-muted',
} as const satisfies Record<ErrorStateTone, string>;

// Busy keeps it focusable (aria-disabled, not disabled) and ignores clicks until it settles.
function ActionButton({ label, onAction }: ErrorStateAction) {
  const { isPending, run } = usePendingAction(onAction);
  return (
    <button
      type="button"
      aria-busy={isPending || undefined}
      aria-disabled={isPending || undefined}
      onClick={isPending ? undefined : run}
      className="flex min-h-12 items-center gap-2 rounded-control bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-wait"
    >
      <RefreshIcon className="size-5" />
      {label}
    </button>
  );
}

export function ErrorState({ tone, icon: Icon, title, body, action, footer }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
      <span className={`flex size-14 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon className="size-7" />
      </span>
      <div role="alert" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        <p className="text-sm text-fg-muted">{body}</p>
      </div>
      {action ? <ActionButton {...action} /> : null}
      {footer ? (
        <p aria-live="off" className="text-sm text-fg-muted">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
