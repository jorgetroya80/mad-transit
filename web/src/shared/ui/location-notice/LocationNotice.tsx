import type { ComponentProps } from 'react';
import { Banner } from '../banner';

type ApproximateLocationBannerProps = {
  isApproximateLocation: boolean;
  isLocationDenied: boolean;
  missingText: string;
  deniedText: string;
};

export function ApproximateLocationBanner({
  isApproximateLocation,
  isLocationDenied,
  missingText,
  deniedText,
}: ApproximateLocationBannerProps) {
  if (!isApproximateLocation) return null;
  return (
    <Banner
      tone="info"
      icon="info"
      announce="polite"
      message={isLocationDenied ? deniedText : missingText}
    />
  );
}

type LocatingTexts = { current: string; denied: string; missing: string };

type LocatingAction = {
  label: string;
  pendingLabel: string;
  onLocate: () => void;
  isLocating: boolean;
};

type LocatingBannerProps = {
  isApproximateLocation: boolean;
  isLocationDenied: boolean;
  texts: LocatingTexts;
  action: LocatingAction;
};

// Polite, as the notice has always been: only its text is read, not the action.
function LocationBanner(props: Pick<ComponentProps<typeof Banner>, 'message' | 'action'>) {
  return <Banner tone="info" icon="pin" announce="polite" {...props} />;
}

// Always on screen, so the user knows what the list is around. A denied permission is not
// asked again: the browser would not show its prompt.
export function LocatingBanner({
  isApproximateLocation,
  isLocationDenied,
  texts,
  action,
}: LocatingBannerProps) {
  if (!isApproximateLocation) return <LocationBanner message={texts.current} />;
  if (isLocationDenied) return <LocationBanner message={texts.denied} />;
  const { label, pendingLabel, onLocate, isLocating } = action;
  return (
    <LocationBanner
      message={texts.missing}
      action={{ label: isLocating ? pendingLabel : label, onClick: onLocate, busy: isLocating }}
    />
  );
}
