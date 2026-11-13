import { ArrivalRow, type FreshArrivals, useFreshArrivals } from '@/entities/bus-stop';
import { usePendingAction } from '@/shared/lib';
import { Banner, Spinner, UpdatedAt } from '@/shared/ui';

const QUOTA_TEXT =
  'Hoy se ha alcanzado el límite de consultas a la EMT. Las llegadas volverán solas; los horarios de abajo siguen siendo válidos.';

// Busy while the retry asks; disabled until a Retry-After has passed.
function Retry({ arrivals }: { arrivals: FreshArrivals }) {
  const { isPending, run } = usePendingAction(arrivals.retry);
  return (
    <Banner
      tone="danger"
      icon="cloud-alert"
      title="Llegadas no disponibles"
      message="El servicio de autobuses no está respondiendo. Suele ser temporal."
      action={{
        label: 'Reintentar',
        onClick: run,
        busy: isPending,
        disabled: arrivals.isRetryBlocked,
      }}
      announce="assertive"
    />
  );
}

// The quota comes back on its own at Retry-After, so there is nothing to press.
function Unavailable({ arrivals }: { arrivals: FreshArrivals }) {
  if (arrivals.isQuotaExhausted) {
    return (
      <Banner
        tone="warning"
        icon="clock"
        title="Llegadas no disponibles"
        message={QUOTA_TEXT}
        announce="polite"
      />
    );
  }
  return <Retry arrivals={arrivals} />;
}

// Mounted only with a stop that loaded: a missing stop never asks for its arrivals.
export function Arrivals({ number }: { number: string }) {
  const arrivals = useFreshArrivals(number);
  if (arrivals.isUnavailable) return <Unavailable arrivals={arrivals} />;
  if (arrivals.arrivals === undefined) {
    return (
      <output aria-busy="true" className="flex items-center gap-2 text-body text-fg-muted">
        <Spinner className="text-primary" />
        Cargando llegadas…
      </output>
    );
  }
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-section text-fg">Llegadas</h4>
      {arrivals.isStale && arrivals.updatedAt ? <UpdatedAt date={arrivals.updatedAt} /> : null}
      {arrivals.arrivals.length === 0 ? (
        <p className="text-body text-fg-muted">No hay autobuses previstos</p>
      ) : (
        <ul aria-label="Llegadas" className="flex flex-col">
          {arrivals.arrivals.map((arrival) => (
            <ArrivalRow key={`${arrival.line} ${arrival.destination}`} arrival={arrival} />
          ))}
        </ul>
      )}
    </section>
  );
}
