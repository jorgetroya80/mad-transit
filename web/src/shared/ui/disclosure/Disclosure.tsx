import { type ReactNode, useId, useState } from 'react';
import { Icon, type IconName } from '../icons';

type DisclosureSize = 'md' | 'sm';
type HeadingLevel = 2 | 3 | 4;

type DisclosureContent = {
  title: string;
  // Already formatted («2»).
  count?: string;
  icon?: IconName;
  headingLevel?: HeadingLevel;
  size?: DisclosureSize;
  children: ReactNode;
};

// Nothing is stored here: whoever needs the open state to last controls it.
type OpenState =
  | { open: boolean; onOpenChange: (open: boolean) => void; defaultOpen?: never }
  | { open?: never; onOpenChange?: (open: boolean) => void; defaultOpen?: boolean };

type DisclosureProps = DisclosureContent & OpenState;

const HEADING_TAGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const satisfies Record<HeadingLevel, string>;

const TITLE_SIZE = {
  md: 'text-base',
  sm: 'text-body',
} as const satisfies Record<DisclosureSize, string>;

const ICON_SIZE = { md: 18, sm: 16 } as const satisfies Record<DisclosureSize, number>;

const BUTTON_CLASSES =
  'focus-ring flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left hover:bg-chip active:bg-line';

const CHEVRON_CLASSES =
  'text-fg-muted transition-transform duration-200 ease-out motion-reduce:transition-none';

function useOpenState({ open, onOpenChange, defaultOpen = true }: OpenState) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;

  function toggle() {
    if (open === undefined) setOwnOpen(!isOpen);
    onOpenChange?.(!isOpen);
  }

  return { isOpen, toggle };
}

// The space stays outside the span, or the accessible name would lose it («Favoritas · 2»).
function Count({ count }: { count: string }) {
  return (
    <>
      {' '}
      <span className="text-meta text-fg-muted">{`· ${count}`}</span>
    </>
  );
}

// The heading takes programmatic focus (tabIndex -1, no ring and no tab stop), so a page can
// move the focus back to the section.
export function Disclosure(props: DisclosureProps) {
  const { title, count, icon, headingLevel = 3, size = 'md', children } = props;
  const { isOpen, toggle } = useOpenState(props);
  const headingId = useId();
  const panelId = useId();
  const Heading = HEADING_TAGS[headingLevel];

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1">
      <Heading id={headingId} tabIndex={-1} className="focus-visible:outline-none">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={toggle}
          className={BUTTON_CLASSES}
        >
          {icon ? <Icon name={icon} size={ICON_SIZE[size]} className="text-primary" /> : null}
          <span className={`flex-1 font-bold text-fg ${TITLE_SIZE[size]}`}>
            {title}
            {count ? <Count count={count} /> : null}
          </span>
          <Icon
            name="chevron-down"
            size={20}
            className={`${CHEVRON_CLASSES} ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </Heading>
      <div id={panelId} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
