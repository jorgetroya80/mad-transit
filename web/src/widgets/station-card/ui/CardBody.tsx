import { availabilityFor, type StationDetailState } from '@/entities/station';
import { usePendingAction } from '@/shared/lib';
import { MessageAction, StateMessage } from '@/shared/ui';
import { CardAvailability } from './CardAvailability';

type CardBodyProps = {
  number: string;
  detail: StationDetailState;
  // What «Cerrar» (the sheet's arrow back) does: a missing station offers it in the body too.
  onClose: () => void;
};

function NotFound({ number, onClose }: Omit<CardBodyProps, 'detail'>) {
  return (
    <div className="flex flex-col gap-3">
      <p role="alert" className="text-sm text-fg">
        {`No hay ninguna estación de BiciMAD con el número ${number}. Puede que el enlace sea antiguo o que la estación se haya retirado.`}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="min-h-11 rounded-control bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Volver a la lista
      </button>
    </div>
  );
}

// Compact, like the card: StateMessage rather than the list's large ErrorState. Offline without
// data reads the same, as the detail has no texts of its own for it.
function LoadError({ retry }: { retry: () => unknown }) {
  const { isPending, run } = usePendingAction(retry);
  return (
    <StateMessage variant="error" title="No se pudo cargar la estación">
      <p>El servicio de BiciMAD no está respondiendo. Suele ser temporal.</p>
      <MessageAction
        aria-busy={isPending || undefined}
        aria-disabled={isPending || undefined}
        onClick={isPending ? undefined : run}
        className="-ml-3 aria-disabled:cursor-wait"
      >
        Reintentar
      </MessageAction>
    </StateMessage>
  );
}

// Instead of two counts that mean nothing: an off station takes and gives no bikes.
function OutOfService() {
  return (
    <output className="flex flex-col gap-1 rounded-control bg-chip px-3 py-2.5">
      <span className="font-semibold text-availability-off-label">Fuera de servicio</span>{' '}
      <span className="text-sm text-fg-muted">No se pueden sacar ni dejar bicis.</span>
    </output>
  );
}

export function CardBody({ number, detail, onClose }: CardBodyProps) {
  if (detail.status === 'loading') {
    return <StateMessage variant="loading" title="Cargando estación…" />;
  }
  if (detail.status === 'not-found') return <NotFound number={number} onClose={onClose} />;
  if (detail.station === undefined) return <LoadError retry={detail.retry} />;
  // Off does not depend on the mode; unconfirmed data greys it out like any other count.
  if (availabilityFor(detail.station, 'bikes', detail.status).level === 'off') {
    return <OutOfService />;
  }
  return <CardAvailability station={detail.station} status={detail.status} />;
}
