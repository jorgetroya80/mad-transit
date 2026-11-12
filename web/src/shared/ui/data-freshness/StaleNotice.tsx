import { NOW_TICK_MS } from '@/shared/config';
import { formatClock, formatMinutesAgo, useNow, usePendingAction } from '@/shared/lib';
import { Banner } from '../banner';

type StaleLayout = 'desktop' | 'mobile';

// Whatever the cause (a failed request, the API's own cache or old data), the data is unconfirmed.
type StaleNoticeProps = {
  layout: StaleLayout;
  updatedAt: Date | undefined;
  // A returned promise keeps «Reintentar» busy until it settles.
  onRetry: () => unknown;
};

type StaleText = { title: string; message: string };

// Desktop has room for the time; mobile leads with the age, which reads faster.
function desktopText(updatedAt: Date | undefined): StaleText {
  return {
    title: 'No hemos podido actualizar.',
    message: updatedAt
      ? `Mostramos los datos de las ${formatClock(updatedAt)}; puede que ya no sean exactos.`
      : 'Puede que los datos ya no sean exactos.',
  };
}

function mobileText(updatedAt: Date | undefined, now: Date): StaleText {
  return {
    title: updatedAt ? `Datos de ${formatMinutesAgo(updatedAt, now)}.` : 'Datos sin confirmar.',
    message: 'No hemos podido actualizar; puede que ya no sean exactos.',
  };
}

export function StaleNotice({ layout, updatedAt, onRetry }: StaleNoticeProps) {
  const { isPending, run } = usePendingAction(onRetry);
  const now = useNow(NOW_TICK_MS);
  const text = layout === 'desktop' ? desktopText(updatedAt) : mobileText(updatedAt, now);
  return (
    <Banner
      tone="warning"
      icon="clock"
      announce="polite"
      {...text}
      action={{ label: 'Reintentar', onClick: run, busy: isPending }}
    />
  );
}
