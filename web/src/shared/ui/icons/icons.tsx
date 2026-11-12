import { IconFrame, type IconProps } from './IconFrame';

export function ChevronIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconFrame>
  );
}
