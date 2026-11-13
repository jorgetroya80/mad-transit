import type { ComponentProps } from 'react';
import { usePendingAction } from '@/shared/lib';
import { Button } from '../button';
import { Icon, type IconName } from '../icons';
import { StatusText } from '../status-text';

type StatusTone = ComponentProps<typeof StatusText>['tone'];

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  logo?: IconName;
  statusText?: string;
  statusTone?: StatusTone;
  showRefresh?: boolean;
  refreshLabel?: string;
  // A returned promise keeps the refresh button busy until it settles.
  onRefresh?: () => unknown;
};

type RefreshButtonProps = { label: string; onRefresh?: () => unknown };

function RefreshButton({ label, onRefresh }: RefreshButtonProps) {
  const { isPending, run } = usePendingAction(() => onRefresh?.());
  return (
    <Button
      size="sm"
      variant="secondary"
      icon="refresh"
      label={label}
      onClick={run}
      busy={isPending}
    />
  );
}

export function AppHeader({
  title,
  subtitle,
  logo,
  statusText,
  statusTone = 'neutral',
  showRefresh = false,
  refreshLabel = 'Actualizar',
  onRefresh,
}: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4">
      <div className="flex items-center gap-3">
        {logo ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
            <Icon name={logo} size={22} />
          </span>
        ) : null}
        <div>
          <h1 className="text-lg leading-tight font-semibold text-fg">{title}</h1>
          {subtitle ? <p className="text-body text-fg-muted">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {statusText ? <StatusText text={statusText} tone={statusTone} /> : null}
        {showRefresh ? <RefreshButton label={refreshLabel} onRefresh={onRefresh} /> : null}
      </div>
    </header>
  );
}
