import { ICON_DRAWINGS, type IconName } from './iconDrawings';

export const ICON_SIZES = [16, 18, 20, 22, 24, 30, 34] as const;

export type IconSize = (typeof ICON_SIZES)[number];

type IconProps = { name: IconName; size?: IconSize; className?: string };

// Always decorative: the piece that shows the icon carries the accessible name.
export function Icon({ name, size = 20, className = '' }: IconProps) {
  const { paths, strokeWidth, isFilled } = ICON_DRAWINGS[name];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
