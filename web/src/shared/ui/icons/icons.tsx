import { IconFrame, type IconProps } from './IconFrame';

export function OfflineIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-2-1.4M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M12 20h.01" />
    </IconFrame>
  );
}

export function LocationIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </IconFrame>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconFrame>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M12 5v14M5 12h14" />
    </IconFrame>
  );
}

export function MinusIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M5 12h14" />
    </IconFrame>
  );
}
