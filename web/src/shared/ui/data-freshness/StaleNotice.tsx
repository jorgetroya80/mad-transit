import type { ReactNode } from 'react';
import { NOW_TICK_MS } from '@/shared/config';
import { formatClock, formatMinutesAgo, useNow, usePendingAction } from '@/shared/lib';
import { StatusBanner } from '../status-banner';

type StaleLayout = 'desktop' | 'mobile';

// Whatever the cause (a failed request, the API's own cache or old data), the data is unconfirmed.
type StaleNoticeProps = {
  layout: StaleLayout;
  updatedAt: Date | undefined;
  // A returned promise keeps «Reintentar» busy until it settles.
  onRetry: () => unknown;
};

type StaleTextProps = { updatedAt: Date | undefined };

// Desktop has room for the time; mobile leads with the age, which reads faster.
function DesktopText({ updatedAt }: StaleTextProps) {
  return (
    <>
      <strong>No hemos podido actualizar.</strong>{' '}
      {updatedAt
        ? `Mostramos los datos de las ${formatClock(updatedAt)}; puede que ya no sean exactos.`
        : 'Puede que los datos ya no sean exactos.'}
    </>
  );
}

function MobileText({ updatedAt }: StaleTextProps) {
  const now = useNow(NOW_TICK_MS);
  return (
    <>
      <strong>
        {updatedAt ? `Datos de ${formatMinutesAgo(updatedAt, now)}.` : 'Datos sin confirmar.'}
      </strong>{' '}
      No hemos podido actualizar; puede que ya no sean exactos.
    </>
  );
}

const TEXTS = { desktop: DesktopText, mobile: MobileText } as const satisfies Record<
  StaleLayout,
  (props: StaleTextProps) => ReactNode
>;

export function StaleNotice({ layout, updatedAt, onRetry }: StaleNoticeProps) {
  const { isPending, run } = usePendingAction(onRetry);
  const Text = TEXTS[layout];
  return (
    <StatusBanner variant="stale" action={{ label: 'Reintentar', onClick: run, isPending }}>
      <Text updatedAt={updatedAt} />
    </StatusBanner>
  );
}
