import type { IconSize } from '../icons';

type SpinnerProps = { size?: IconSize; className?: string };

// Decorative like Icon: the busy piece says what it waits for. With reduced motion it stays
// an incomplete ring, which still reads as a wait.
export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeWidth="2.4"
      strokeLinecap="round"
      className={`shrink-0 animate-spin motion-reduce:animate-none ${className}`}
    >
      <circle cx="12" cy="12" r="9" className="stroke-line" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" />
    </svg>
  );
}
