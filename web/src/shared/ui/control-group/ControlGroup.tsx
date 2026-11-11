import type { ReactNode } from 'react';

type Orientation = 'vertical' | 'horizontal';

type ControlGroupProps = {
  label: string;
  orientation?: Orientation;
  // From 2 to 4 IconButtons.
  children: ReactNode;
};

const ORIENTATION_CLASSES = {
  vertical: 'flex-col divide-y',
  horizontal: 'flex-row divide-x',
} as const satisfies Record<Orientation, string>;

// A fieldset rather than role="group", which oxlint's prefer-tag-over-role rejects. The box clips
// its square buttons, so each hover and press stays in its own cell and the focus ring is drawn
// inside the button.
const BOX_CLASSES =
  'inline-flex overflow-hidden rounded-control bg-surface shadow-control divide-line-subtle *:rounded-none [--focus-ring-offset:-2px]';

export function ControlGroup({ label, orientation = 'vertical', children }: ControlGroupProps) {
  return (
    <fieldset aria-label={label} className={`${BOX_CLASSES} ${ORIENTATION_CLASSES[orientation]}`}>
      {children}
    </fieldset>
  );
}
