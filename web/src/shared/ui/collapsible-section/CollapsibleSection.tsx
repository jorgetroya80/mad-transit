import { type ReactNode, useId } from 'react';
import { useLocalStorage } from '@/shared/lib';
import { ChevronIcon, type StarIcon } from '../icons';

type SectionIcon = typeof StarIcon;

type CollapsibleSectionProps = {
  title: string;
  count: number;
  icon: SectionIcon;
  // Where the open state is kept, so it survives a reload.
  storageKey: string;
  children: ReactNode;
};

function parseOpen(raw: unknown): boolean | undefined {
  return typeof raw === 'boolean' ? raw : undefined;
}

// The heading takes programmatic focus (`tabIndex={-1}`, no tab stop), so a page can move the
// focus to the section as it does with any other list heading.
export function CollapsibleSection({
  title,
  count,
  icon: Icon,
  storageKey,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setOpen] = useLocalStorage(storageKey, parseOpen, true);
  const headingId = useId();
  const contentId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} tabIndex={-1} className="focus-visible:outline-none">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setOpen(!isOpen)}
          className="flex min-h-11 w-full items-center gap-2 rounded-control px-1 text-left text-base font-semibold text-fg hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Icon className="size-5 shrink-0 text-primary" />
          <span className="flex-1">{`${title} · ${count}`}</span>
          <ChevronIcon
            className={`size-5 shrink-0 text-fg-muted transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>
      <div id={contentId} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
