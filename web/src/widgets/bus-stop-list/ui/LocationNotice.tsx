import { LocatingBanner } from '@/shared/ui';

type Layout = 'desktop' | 'mobile';

type LocationNoticeProps = {
  layout: Layout;
  isApproximateLocation: boolean;
  isLocationDenied: boolean;
  onLocate: () => void;
  isLocating: boolean;
};

const DENIED_TEXT =
  'No has dado permiso de ubicación: mostrando paradas cerca de la Puerta del Sol';

// Desktop says why the list is around Sol and offers to ask again; mobile keeps it short.
const NO_LOCATION = {
  desktop: {
    text: 'Mostrando paradas cerca de la Puerta del Sol porque no tenemos tu ubicación.',
    label: 'Usar mi ubicación',
    pendingLabel: 'Localizando…',
  },
  mobile: {
    text: 'Sin tu ubicación: cerca de la Puerta del Sol',
    label: 'Activar',
    pendingLabel: 'Activar',
  },
} as const satisfies Record<Layout, { text: string; label: string; pendingLabel: string }>;

// Always on screen, so the user knows what the list is around.
export function LocationNotice({
  layout,
  isApproximateLocation,
  isLocationDenied,
  onLocate,
  isLocating,
}: LocationNoticeProps) {
  const { text, label, pendingLabel } = NO_LOCATION[layout];
  return (
    <LocatingBanner
      isApproximateLocation={isApproximateLocation}
      isLocationDenied={isLocationDenied}
      texts={{ current: 'Usando tu ubicación actual.', denied: DENIED_TEXT, missing: text }}
      action={{ label, pendingLabel, onLocate, isLocating }}
    />
  );
}
