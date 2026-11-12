import type { ComponentProps } from 'react';
import { ApproximateLocationBanner, LocatingBanner } from '@/shared/ui';

const DENIED_TEXT =
  'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol';

type LocationProps = Pick<
  ComponentProps<typeof ApproximateLocationBanner>,
  'isApproximateLocation' | 'isLocationDenied'
>;

export function ApproximateLocationNotice(props: LocationProps) {
  return (
    <ApproximateLocationBanner
      {...props}
      missingText="Sin ubicación: mostrando estaciones cerca de la Puerta del Sol"
      deniedText={DENIED_TEXT}
    />
  );
}

export type LocatingLayout = 'desktop' | 'mobile';

type LocatingNoticeProps = LocationProps & {
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

// Always on screen, so the user knows what the list is around.
export function LocatingNotice({ layout, onLocate, isLocating, ...location }: LocatingNoticeProps) {
  const { text, label, pendingLabel } = NO_LOCATION[layout];
  return (
    <LocatingBanner
      {...location}
      texts={{ current: 'Usando tu ubicación actual.', denied: DENIED_TEXT, missing: text }}
      action={{ label, pendingLabel, onLocate, isLocating }}
    />
  );
}
