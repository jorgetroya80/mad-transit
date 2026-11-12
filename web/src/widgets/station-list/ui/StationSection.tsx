import { type ReactNode, useId } from 'react';

type StationListSection = 'favorites' | 'nearby';

type StationSectionProps = {
  section: StationListSection;
  heading: string;
  // What the numbers in the rows count, so the filter's effect is spelled out under the heading.
  caption?: string;
  // 3 when the list sits under another heading, as in the mobile sheet.
  level?: 2 | 3;
  children: ReactNode;
};

// `data-station-list` and the focusable heading (`tabIndex={-1}`, no tab stop) let the page
// return the focus to the section a detail was opened from, or to its heading.
export function StationSection({
  section,
  heading,
  caption,
  level = 2,
  children,
}: StationSectionProps) {
  const headingId = useId();
  const captionId = useId();
  const Heading = level === 3 ? 'h3' : 'h2';
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={caption === undefined ? undefined : captionId}
      data-station-list={section}
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <Heading id={headingId} tabIndex={-1} className="text-section text-fg focus-ring">
          {heading}
        </Heading>
        {caption === undefined ? null : (
          <p id={captionId} className="text-meta text-fg-muted">
            {caption}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
