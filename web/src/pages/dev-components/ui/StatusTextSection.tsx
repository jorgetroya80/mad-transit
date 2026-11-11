import { Button, StatusText } from '@/shared/ui';
import { LiveRegionNote } from './LiveRegionNote';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

const UPDATED = 'Actualizado hace 30 s';
const STALE = 'Datos de hace 12 min';

function ignorePress() {}

const TONE_SPECIMENS: Specimen[] = [
  { caption: 'success', piece: <StatusText tone="success" text={UPDATED} /> },
  { caption: 'warning', piece: <StatusText tone="warning" text={STALE} /> },
  { caption: 'danger', piece: <StatusText tone="danger" text="Sin datos del servicio" /> },
  { caption: 'neutral', piece: <StatusText tone="neutral" text="Desconectado" /> },
];

const SIZE_SPECIMENS: Specimen[] = [
  {
    caption: 'sm · sin punto (pie de Card)',
    piece: <StatusText tone="success" size="sm" showDot={false} text={UPDATED} />,
  },
  { caption: 'sm', piece: <StatusText tone="success" size="sm" text={UPDATED} /> },
  {
    caption: 'Con Button sm',
    piece: (
      <span className="flex items-center gap-2.5">
        <StatusText tone="warning" text={STALE} />
        <Button
          variant="outline"
          tone="warning"
          size="sm"
          label="Reintentar"
          onClick={ignorePress}
        />
      </span>
    ),
  },
  {
    caption: 'danger · live="polite"',
    piece: <StatusText tone="danger" live="polite" text="Llegadas no disponibles" />,
  },
];

export function StatusTextSection() {
  return (
    <ReviewSection title="StatusText">
      <LiveRegionNote live='live="polite"' quiet='live="off"' />
      <SpecimenRow title="Tonos · md" specimens={TONE_SPECIMENS} />
      <SpecimenRow title="sm, sin punto y con acción al lado" specimens={SIZE_SPECIMENS} />
    </ReviewSection>
  );
}
