import type { BusLine } from '@/entities/bus-stop';
import { formatDistance } from '@/entities/station';
import { useSelectedStop } from '@/features/select-stop';
import { type GeoPosition, usePendingAction } from '@/shared/lib';
import { Banner, EmptyState, IconButton, Spinner, StaleNotice, Tag } from '@/shared/ui';
import { type LineRow, toLineRows } from '../lib/toLineRows';
import { type StopDetail, useStopDetail } from '../model/useStopDetail';
import { Arrivals } from './Arrivals';

type Layout = 'desktop' | 'mobile';

type BusStopDetailProps = {
  number: string;
  // The nearby list's center: the distance is read from it. Undefined hides the distance.
  center: GeoPosition | undefined;
  layout: Layout;
};

const MESSAGE_CLASSES = 'flex items-center gap-2 text-body text-fg-muted';
const HEAD_CLASSES = 'text-meta font-normal text-fg-muted';

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <EmptyState
      tone="neutral"
      icon="bus"
      title="Parada no encontrada"
      message="Puede que el enlace sea antiguo o que la parada ya no exista."
      action={{ label: 'Volver a la lista', onClick: onBack }}
      size="sm"
    />
  );
}

// Busy while the retry asks; disabled until a Retry-After has passed.
function LoadError({ detail }: { detail: StopDetail }) {
  const { isPending, run } = usePendingAction(detail.retry);
  return (
    <Banner
      tone="danger"
      icon="cloud-alert"
      title="No se pudo cargar la parada"
      message="El servicio de autobuses no está respondiendo. Suele ser temporal."
      action={{
        label: 'Reintentar',
        onClick: run,
        busy: isPending,
        disabled: detail.isRetryBlocked,
      }}
      announce="assertive"
    />
  );
}

function StopHeader({
  number,
  detail,
  onBack,
}: {
  number: string;
  detail: StopDetail;
  onBack: () => void;
}) {
  const { stop, distanceMeters } = detail;
  const distance = distanceMeters === undefined ? '' : ` · ${formatDistance(distanceMeters)}`;
  return (
    <header className="flex items-start gap-2">
      <IconButton
        label="Volver a la lista"
        icon="chevron-left"
        iconSize={22}
        iconTone="primary"
        onClick={onBack}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={HEAD_CLASSES}>{`Parada ${number}${distance}`}</p>
        <h3 className="text-section break-words text-fg">{stop?.name ?? `Parada ${number}`}</h3>
        {stop?.address ? <p className="text-body text-fg-muted">{stop.address}</p> : null}
      </div>
    </header>
  );
}

function LineLabel({ row }: { row: LineRow }) {
  return (
    <span className="flex shrink-0 flex-col items-start gap-1">
      <Tag label={row.label} />
      {row.isNight ? <span className="text-caption text-fg-muted">Nocturno</span> : null}
    </span>
  );
}

function LineTable({ rows }: { rows: readonly LineRow[] }) {
  return (
    <table aria-label="Líneas de la parada" className="w-full text-left text-body">
      <thead className={HEAD_CLASSES}>
        <tr>
          <th scope="col" className="pb-2 font-normal">
            Línea
          </th>
          <th scope="col" className="pb-2 font-normal">
            Hacia
          </th>
          <th scope="col" className="pb-2 font-normal">
            Horario
          </th>
          <th scope="col" className="pb-2 font-normal">
            Cada
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.label} ${row.towards}`} className="border-t border-line-subtle align-top">
            <td className="py-2 pr-3">
              <LineLabel row={row} />
            </td>
            <td className="py-2 pr-3">{row.towards}</td>
            <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{row.schedule}</td>
            <td className="py-2 whitespace-nowrap tabular-nums">{row.frequency}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LineList({ rows }: { rows: readonly LineRow[] }) {
  return (
    <ul aria-label="Líneas de la parada" className="flex flex-col">
      {rows.map((row) => (
        <li
          key={`${row.label} ${row.towards}`}
          className="flex items-start gap-3 border-t border-line-subtle py-2.5"
        >
          <LineLabel row={row} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label text-fg">{row.towards}</span>
            <span className="text-meta text-fg-muted">{row.schedule}</span>
            <span className="text-meta text-fg-muted">{`Cada ${row.frequency}`}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Lines({ lines, layout }: { lines: readonly BusLine[]; layout: Layout }) {
  const rows = toLineRows(lines);
  return layout === 'desktop' ? <LineTable rows={rows} /> : <LineList rows={rows} />;
}

function Pending({ detail }: { detail: StopDetail }) {
  if (detail.isError) return <LoadError detail={detail} />;
  return (
    <output aria-busy="true" className={MESSAGE_CLASSES}>
      <Spinner className="text-primary" />
      Cargando parada…
    </output>
  );
}

export function BusStopDetail({ number, center, layout }: BusStopDetailProps) {
  const detail = useStopDetail(number, center);
  const { clear } = useSelectedStop();

  if (detail.isNotFound) return <NotFound onBack={clear} />;
  return (
    <div className="flex flex-col gap-4">
      <StopHeader number={number} detail={detail} onBack={clear} />
      {detail.isStale ? (
        <StaleNotice layout={layout} updatedAt={detail.updatedAt} onRetry={detail.retry} />
      ) : null}
      {detail.stop ? (
        <>
          <Arrivals number={number} />
          <Lines lines={detail.stop.lines} layout={layout} />
        </>
      ) : (
        <Pending detail={detail} />
      )}
    </div>
  );
}
