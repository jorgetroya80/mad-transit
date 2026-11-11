import type { ReactNode } from 'react';
import { Button, type ButtonLook } from '../button';
import { Icon, type IconName } from '../icons';

type BannerTone = 'info' | 'warning' | 'danger' | 'inverse';
type BannerLayout = 'card' | 'bar' | 'float';
type Announce = 'none' | 'polite' | 'assertive';

type BannerAction = { label: string; onClick: () => void; busy?: boolean; disabled?: boolean };

type BannerProps = {
  tone: BannerTone;
  message: string;
  title?: string;
  icon?: IconName;
  action?: BannerAction;
  announce?: Announce;
  layout?: BannerLayout;
};

// Primary on tone-inverse falls below 3:1, so the ring of any button inside turns white.
const SURFACE_CLASSES = {
  info: 'bg-tone-info-soft border border-tone-info-soft-line',
  warning: 'bg-tone-warning-soft border border-tone-warning-soft-line',
  danger: 'bg-tone-danger-soft',
  inverse: 'bg-tone-inverse [--focus-ring-color:var(--color-tone-inverse-foreground)]',
} as const satisfies Record<BannerTone, string>;

const TEXT_CLASSES = {
  info: 'text-fg',
  warning: 'text-tone-warning-soft-foreground',
  danger: 'text-tone-danger-soft-foreground',
  inverse: 'text-tone-inverse-foreground',
} as const satisfies Record<BannerTone, string>;

const ICON_CLASSES = {
  info: 'text-tone-info-icon',
  warning: 'text-tone-warning-icon',
  danger: 'text-tone-danger-icon',
  inverse: 'text-tone-inverse-icon',
} as const satisfies Record<BannerTone, string>;

// The design gives inverse no action yet; secondary is the one that reads on the dark fill.
const ACTION_LOOKS = {
  info: { variant: 'primary' },
  warning: { variant: 'outline', tone: 'warning' },
  danger: { variant: 'secondary' },
  inverse: { variant: 'secondary' },
} as const satisfies Record<BannerTone, ButtonLook>;

// The text grows on a card, so the action sits at the end; on a bar it stays its size, so the
// whole notice is centered. A float is the card over the mobile map, with smaller text.
const LAYOUT_CLASSES = {
  card: { banner: 'rounded-card px-3.5 py-3', text: 'grow basis-40 text-body' },
  bar: { banner: 'w-full rounded-none justify-center px-6 py-3', text: 'text-body' },
  float: { banner: 'rounded-card px-3.5 py-3 shadow-pill', text: 'grow basis-40 text-meta' },
} as const satisfies Record<BannerLayout, { banner: string; text: string }>;

type BannerTextProps = { announce: Announce; className: string; children: ReactNode };

// polite is an <output>, since oxlint's prefer-tag-over-role rejects role="status".
function BannerText({ announce, className, children }: BannerTextProps) {
  if (announce === 'assertive') {
    return (
      <div role="alert" className={className}>
        {children}
      </div>
    );
  }
  const Text = announce === 'polite' ? 'output' : 'p';
  return <Text className={className}>{children}</Text>;
}

// Only the title and the message are live: the action stays out of what is read out.
export function Banner({
  tone,
  message,
  title,
  icon,
  action,
  announce = 'none',
  layout = 'card',
}: BannerProps) {
  const layoutClasses = LAYOUT_CLASSES[layout];
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2.5 ${layoutClasses.banner} ${SURFACE_CLASSES[tone]}`}
    >
      {icon ? <Icon name={icon} className={ICON_CLASSES[tone]} /> : null}
      <BannerText
        announce={announce}
        className={`min-w-0 ${layoutClasses.text} ${TEXT_CLASSES[tone]}`}
      >
        {title ? <strong>{title}</strong> : null}
        {title ? ' ' : null}
        {message}
      </BannerText>
      {action ? <Button size="sm" {...action} {...ACTION_LOOKS[tone]} /> : null}
    </div>
  );
}
