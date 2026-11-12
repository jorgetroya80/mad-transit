import type { ReactNode } from 'react';
import { Button } from '../button';
import { Icon, type IconName } from '../icons';

type EmptyStateTone = 'danger' | 'neutral' | 'warning';
type EmptyStateSize = 'md' | 'sm';
type Announce = 'alert' | 'status' | 'none';

type EmptyStateAction = {
  label: string;
  icon?: IconName;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
};

type EmptyStateProps = {
  tone: EmptyStateTone;
  icon: IconName;
  title: string;
  message: string;
  action?: EmptyStateAction;
  // Outside any live region: a countdown here would be read again every second.
  note?: string;
  children?: ReactNode;
  announce?: Announce;
  // Id of the heading and message together, so a field can be described by them.
  messageId?: string;
  headingLevel?: 2 | 3;
  size?: EmptyStateSize;
};

// The design colors warning only by name; it takes the soft fill and icon of its tone.
const TONE_CLASSES = {
  danger: { circle: 'bg-tone-danger-soft', icon: 'text-tone-danger-icon' },
  neutral: { circle: 'bg-chip', icon: 'text-fg-muted' },
  warning: { circle: 'bg-tone-warning-soft', icon: 'text-tone-warning-icon' },
} as const satisfies Record<EmptyStateTone, { circle: string; icon: string }>;

const SIZES = {
  md: { root: 'px-8 py-10', circle: 'size-18', icon: 34, title: 'text-title-lg' },
  sm: {
    root: 'px-7 py-4',
    circle: 'size-16',
    icon: 30,
    title: 'text-[1.1875rem]/[1.625rem] font-bold',
  },
} as const satisfies Record<
  EmptyStateSize,
  { root: string; circle: string; icon: 30 | 34; title: string }
>;

const STACK = 'flex flex-col items-center gap-3.5';
const MESSAGE_CLASSES = 'max-w-80 text-label leading-normal font-normal text-fg-muted';

type TextProps = { announce: Announce; id?: string; heading: ReactNode; message: string };

// Both live regions read the heading and the message together. Status is an <output>, since
// oxlint's prefer-tag-over-role rejects role="status"; the space keeps its title and message
// apart in the text it announces.
function AnnouncedText({ announce, id, heading, message }: TextProps) {
  const paragraph = <p className={MESSAGE_CLASSES}>{message}</p>;
  if (announce === 'status') {
    return (
      <output id={id} className={STACK}>
        {heading} {paragraph}
      </output>
    );
  }
  return (
    <div id={id} role={announce === 'alert' ? 'alert' : undefined} className={STACK}>
      {heading}
      {paragraph}
    </div>
  );
}

// The heading takes programmatic focus (`tabIndex={-1}`, no tab stop), so a page can move the
// focus there; the action never takes it on its own.
export function EmptyState({
  tone,
  icon,
  title,
  message,
  action,
  note,
  children,
  announce = 'alert',
  messageId,
  headingLevel = 2,
  size = 'md',
}: EmptyStateProps) {
  const sizes = SIZES[size];
  const toneClasses = TONE_CLASSES[tone];
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const heading = (
    <Heading tabIndex={-1} className={`text-fg focus-visible:outline-none ${sizes.title}`}>
      {title}
    </Heading>
  );
  return (
    <div className={`${STACK} text-center ${sizes.root}`}>
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-full ${sizes.circle} ${toneClasses.circle}`}
      >
        <Icon name={icon} size={sizes.icon} className={toneClasses.icon} />
      </span>
      <AnnouncedText announce={announce} id={messageId} heading={heading} message={message} />
      {action ? (
        <div className="pt-1.5">
          <Button size="lg" {...action} />
        </div>
      ) : null}
      {note ? <p className="text-meta text-fg-muted">{note}</p> : null}
      {children}
    </div>
  );
}
