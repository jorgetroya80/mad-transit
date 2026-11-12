import { IconFrame, type IconProps } from './IconFrame';

export function BikeIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6h2l3 11.5M5.5 17.5 9 9h7l-4.5 8.5H5.5M9 9 8 6H6" />
    </IconFrame>
  );
}

export function DockIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect x="9" y="3" width="6" height="12" rx="1" />
      <path d="M12 15v6M7 21h10" />
    </IconFrame>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </IconFrame>
  );
}

export function OfflineIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-2-1.4M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M12 20h.01" />
    </IconFrame>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
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

export function RefreshIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5M3 21v-5h5" />
    </IconFrame>
  );
}
