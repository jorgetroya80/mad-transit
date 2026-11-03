import type { StationDetailState } from '@/entities/station';
import { MessageAction, StateMessage } from '@/shared/ui';
import { CardAvailability } from './CardAvailability';

type CardBodyProps = { detail: StationDetailState };

// The card's «Cerrar» (the sheet's arrow back) closes every state, so not found needs no action
// of its own.
export function CardBody({ detail }: CardBodyProps) {
  if (detail.status === 'loading') {
    return <StateMessage variant="loading" title="Cargando estación…" />;
  }
  if (detail.status === 'not-found') {
    return <StateMessage variant="error" title="Estación no encontrada" />;
  }
  // Offline without data looks like an error until web-error-states gives it its own text.
  if (detail.station === undefined) {
    return (
      <StateMessage variant="error" title="No se pudo cargar la estación">
        <MessageAction onClick={detail.retry}>Reintentar</MessageAction>
      </StateMessage>
    );
  }
  return <CardAvailability station={detail.station} status={detail.status} />;
}
