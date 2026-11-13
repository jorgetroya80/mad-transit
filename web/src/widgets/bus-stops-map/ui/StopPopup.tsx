import { formatArrival, useFreshArrivals, useStop } from '@/entities/bus-stop';
import { Tag } from '@/shared/ui';

const POPUP_ARRIVALS = 3;

// Reads the detail's queries, so opening the popup next to the detail asks for nothing new.
export function StopPopup({ number }: { number: string }) {
  const { data } = useStop(number);
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-meta text-fg-muted">{`Parada ${number}`}</p>
        {data ? <p className="text-label text-fg">{data.stop.name}</p> : null}
      </div>
      {data ? (
        <ul aria-label="Líneas de la parada" className="flex flex-wrap gap-1">
          {data.stop.lines.map((line) => (
            <li key={line.label}>
              <Tag label={line.label} />
            </li>
          ))}
        </ul>
      ) : null}
      <PopupArrivals number={number} />
    </div>
  );
}

function PopupArrivals({ number }: { number: string }) {
  const arrivals = useFreshArrivals(number);
  if (arrivals.isUnavailable) {
    return <p className="text-body text-fg-muted">Llegadas no disponibles</p>;
  }
  if (arrivals.arrivals === undefined) return null;
  if (arrivals.arrivals.length === 0) {
    return <p className="text-body text-fg-muted">No hay autobuses previstos</p>;
  }
  return (
    <ul aria-label="Próximas llegadas" className="flex flex-col gap-1 text-body text-fg">
      {arrivals.arrivals.slice(0, POPUP_ARRIVALS).map((arrival) => (
        <li key={`${arrival.line} ${arrival.destination}`}>
          {`${arrival.line} → ${arrival.destination} · ${formatArrival(arrival)}`}
        </li>
      ))}
    </ul>
  );
}
