import type { ReactNode } from 'react';

export type IconProps = { className?: string };

type IconFrameProps = IconProps & { children: ReactNode };

// Decorative by design: the control or text next to the icon carries the accessible name.
export function IconFrame({ className, children }: IconFrameProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}
