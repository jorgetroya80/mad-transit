import type { ComponentProps } from 'react';
import { Banner } from '@/shared/ui';

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
    <Banner
      tone="info"
      icon="info"
      announce="polite"
      message={
        isLocationDenied
          ? DENIED_TEXT
          : 'Sin ubicación: mostrando estaciones cerca de la Puerta del Sol'
      }
    />
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

type LocationBannerProps = Pick<ComponentProps<typeof Banner>, 'message' | 'action'>;

// Polite, as the notice has always been: only its text is read, not the action.
function LocationBanner(props: LocationBannerProps) {
  return <Banner tone="info" icon="pin" announce="polite" {...props} />;
}

// Always on screen, so the user knows what the list is around. A denied permission is not
// asked again: the browser would not show its prompt.
export function LocatingNotice({
  isApproximateLocation,
  isLocationDenied,
  layout,
  onLocate,
  isLocating,
}: LocatingNoticeProps) {
  if (!isApproximateLocation) return <LocationBanner message="Usando tu ubicación actual." />;
  if (isLocationDenied) return <LocationBanner message={DENIED_TEXT} />;
  const { text, label, pendingLabel } = NO_LOCATION[layout];
  return (
    <LocationBanner
      message={text}
      action={{ label: isLocating ? pendingLabel : label, onClick: onLocate, busy: isLocating }}
    />
  );
}
