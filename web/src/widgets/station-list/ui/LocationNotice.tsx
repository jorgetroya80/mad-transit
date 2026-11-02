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

type DesktopLocationNoticeProps = LocationNoticeProps & {
  onLocate: () => void;
  isLocating: boolean;
};

// Always on screen, so the user knows what the list is around. A denied permission is not
// asked again: the browser would not show its prompt.
export function DesktopLocationNotice({
  isApproximateLocation,
  isLocationDenied,
  onLocate,
  isLocating,
}: DesktopLocationNoticeProps) {
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
  return (
    <StatusBanner
      variant="info"
      icon={LocationIcon}
      action={{
        label: isLocating ? 'Localizando…' : 'Usar mi ubicación',
        onClick: onLocate,
        isPending: isLocating,
      }}
    >
      Mostrando estaciones cerca de la Puerta del Sol porque no tenemos tu ubicación.
    </StatusBanner>
  );
}
