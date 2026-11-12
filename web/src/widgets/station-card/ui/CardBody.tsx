import { availabilityFor, type StationDetailState } from '@/entities/station';
import { usePendingAction } from '@/shared/lib';
import { Banner, Button, Card } from '@/shared/ui';
import { CardAvailability } from './CardAvailability';

type CardBodyProps = {
  number: string;
  detail: StationDetailState;
  // What «Cerrar» (the sheet's arrow back) does: a missing station offers it in the body too.
  onClose: () => void;
};

function NotFound({ number, onClose }: Omit<CardBodyProps, 'detail'>) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="text-body text-fg-muted">
        {`No hay ninguna estación de BiciMAD con el número ${number}. Puede que el enlace sea antiguo o que la estación se haya retirado.`}
      </p>
      <Button label="Volver a la lista" onClick={onClose} />
    </div>
  );
}

// Compact, like the card: a notice rather than the list's large EmptyState. Offline without
// data reads the same, as the detail has no texts of its own for it.
function LoadError({ retry }: { retry: () => unknown }) {
  const { isPending, run } = usePendingAction(retry);
  return (
    <Banner
      tone="danger"
      icon="cloud-alert"
      title="No se pudo cargar la estación"
      message="El servicio de BiciMAD no está respondiendo. Suele ser temporal."
      action={{ label: 'Reintentar', onClick: run, busy: isPending }}
      announce="assertive"
    />
  );
}

// Instead of two counts that mean nothing: an off station takes and gives no bikes. No library
// piece draws it: Banner has no neutral tone and StatTile holds a single count.
function OutOfService() {
  return (
    <output className="flex flex-col gap-1 rounded-control bg-chip px-3 py-2.5">
      <span className="font-semibold text-tone-neutral-label">Fuera de servicio</span>{' '}
      <span className="text-body text-fg-muted">No se pueden sacar ni dejar bicis.</span>
    </output>
  );
}

function BodyContent({ number, detail, onClose }: CardBodyProps) {
  if (detail.status === 'not-found') return <NotFound number={number} onClose={onClose} />;
  if (detail.station === undefined) return <LoadError retry={detail.retry} />;
  // Off does not depend on the mode; unconfirmed data greys it out like any other count.
  if (availabilityFor(detail.station, 'bikes', detail.status).level === 'off') {
    return <OutOfService />;
  }
  return <CardAvailability station={detail.station} status={detail.status} />;
}

// Busy swaps the content for the spinner, so BodyContent never renders while loading.
export function CardBody(props: CardBodyProps) {
  return (
    <Card.Body busy={props.detail.status === 'loading'} busyLabel="Cargando estación…">
      <BodyContent {...props} />
    </Card.Body>
  );
}
