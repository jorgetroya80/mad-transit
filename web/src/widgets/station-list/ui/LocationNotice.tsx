import { LocationIcon, StatusBanner } from '@/shared/ui';

const DENIED_TEXT =
  'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol';

type LocationNoticeProps = {
  isApproximateLocation: boolean;
  isLocationDenied: boolean;
};

export function ApproximateLocationNotice({
  isApproximateLocation,
  isLocationDenied,
}: LocationNoticeProps) {
  if (!isApproximateLocation) return null;
  return (
    <StatusBanner variant="info">
      {isLocationDenied
        ? DENIED_TEXT
        : 'Sin ubicación: mostrando estaciones cerca de la Puerta del Sol'}
    </StatusBanner>
  );
}

export type LocatingLayout = 'desktop' | 'mobile';

type LocatingNoticeProps = LocationNoticeProps & {
  layout: LocatingLayout;
  onLocate: () => void;
  isLocating: boolean;
};

// The mobile notice is the compact one of the design: it keeps «Activar» while asking, and
// `aria-busy` says the request is pending.
const NO_LOCATION = {
  desktop: {
    text: 'Mostrando estaciones cerca de la Puerta del Sol porque no tenemos tu ubicación.',
    label: 'Usar mi ubicación',
    pendingLabel: 'Localizando…',
  },
  mobile: {
    text: 'Sin tu ubicación: cerca de la Puerta del Sol',
    label: 'Activar',
    pendingLabel: 'Activar',
  },
} as const satisfies Record<LocatingLayout, { text: string; label: string; pendingLabel: string }>;

// Always on screen, so the user knows what the list is around. A denied permission is not
// asked again: the browser would not show its prompt.
export function LocatingNotice({
  isApproximateLocation,
  isLocationDenied,
  layout,
  onLocate,
  isLocating,
}: LocatingNoticeProps) {
  if (!isApproximateLocation) {
    return (
      <StatusBanner variant="info" icon={LocationIcon}>
        Usando tu ubicación actual.
      </StatusBanner>
    );
  }
  if (isLocationDenied) {
    return (
      <StatusBanner variant="info" icon={LocationIcon}>
        {DENIED_TEXT}
      </StatusBanner>
    );
  }
  const { text, label, pendingLabel } = NO_LOCATION[layout];
  return (
    <StatusBanner
      variant="info"
      icon={LocationIcon}
      action={{
        label: isLocating ? pendingLabel : label,
        onClick: onLocate,
        isPending: isLocating,
      }}
    >
      {text}
    </StatusBanner>
  );
}
