import { type ReactNode, useId } from 'react';

type ReviewSectionProps = { title: string; children: ReactNode };

export function ReviewSection({ title, children }: ReviewSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-title text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}
