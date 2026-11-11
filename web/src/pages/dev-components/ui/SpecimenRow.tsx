import type { ReactNode } from 'react';

export type Specimen = { caption: string; piece: ReactNode };

type SpecimenRowProps = { title: string; specimens: readonly Specimen[] };

// One drawing of the board: a piece in each of its states, captioned like the board.
export function SpecimenRow({ title, specimens }: SpecimenRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-meta font-bold text-fg">{title}</h3>
      <ul aria-label={title} className="flex flex-wrap items-end gap-x-6 gap-y-4">
        {specimens.map(({ caption, piece }) => (
          <li key={caption} className="flex flex-col items-start gap-2">
            {piece}
            <span className="text-caption text-fg-muted">{caption}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
