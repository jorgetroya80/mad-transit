import type { ComponentProps } from 'react';
import { Button, EmptyState } from '@/shared/ui';
import { LiveRegionNote } from './LiveRegionNote';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type EmptyStateProps = ComponentProps<typeof EmptyState>;
type EmptyStateAction = NonNullable<EmptyStateProps['action']>;

const WIDTHS = {
  md: 'w-95 max-w-[calc(100vw-3rem)]',
  sm: 'w-85 max-w-[calc(100vw-3rem)]',
} as const;

function ignorePress() {}

function retryAction(state: Partial<EmptyStateAction> = {}): EmptyStateAction {
  return { label: 'Reintentar', icon: 'refresh', onClick: ignorePress, ...state };
}

const API_DOWN: EmptyStateProps = {
  tone: 'danger',
  icon: 'cloud-alert',
  title: 'No podemos cargar las estaciones',
  message:
    'El servicio no está respondiendo. Suele ser temporal; no es un problema de tu conexión.',
  action: retryAction(),
  note: 'Lo seguiremos intentando automáticamente.',
  announce: 'none',
};

// Bordered like the board, so the padding shows.
function framed(props: EmptyStateProps) {
  return (
    <div
      className={`rounded-card border border-dashed border-line-strong bg-surface ${WIDTHS[props.size ?? 'md']}`}
    >
      <EmptyState {...props} />
    </div>
  );
}

const TONE_SPECIMENS: Specimen[] = [
  {
    caption: 'danger · md · announce="status"',
    piece: framed({ ...API_DOWN, announce: 'status' }),
  },
  {
    caption: 'neutral · md · sin acción',
    piece: framed({
      tone: 'neutral',
      icon: 'wifi-off',
      title: 'Sin conexión a internet',
      message:
        'Necesitas conexión para ver las estaciones la primera vez. Se cargarán solas al volver a conectarte.',
      announce: 'none',
    }),
  },
  {
    caption: 'warning · md',
    piece: framed({
      tone: 'warning',
      icon: 'clock',
      title: 'Llegadas no disponibles por ahora',
      message: 'Hemos llegado al límite de consultas. Vuelve a intentarlo en unos minutos.',
      announce: 'none',
    }),
  },
  { caption: 'danger · sm (móvil)', piece: framed({ ...API_DOWN, size: 'sm' }) },
  {
    caption: 'neutral · sm · h3 · con contenido extra',
    piece: framed({
      tone: 'neutral',
      icon: 'search',
      title: 'No existe la parada 9999',
      message: 'Revisa el número en la marquesina.',
      headingLevel: 3,
      size: 'sm',
      announce: 'none',
      children: <Button variant="secondary" label="Ver paradas cercanas" onClick={ignorePress} />,
    }),
  },
];

const ACTION_SPECIMENS: Specimen[] = [
  { caption: 'Normal', piece: framed({ ...API_DOWN, size: 'sm' }) },
  {
    caption: 'Ocupado',
    piece: framed({ ...API_DOWN, size: 'sm', action: retryAction({ busy: true }) }),
  },
  {
    caption: 'Desactivado',
    piece: framed({ ...API_DOWN, size: 'sm', action: retryAction({ disabled: true }) }),
  },
];

export function EmptyStateSection() {
  return (
    <ReviewSection title="EmptyState">
      <LiveRegionNote live='announce="status"' quiet='announce="none"' />
      <SpecimenRow title="Tonos y tamaños" specimens={TONE_SPECIMENS} />
      <SpecimenRow title="Estados de la acción (Button lg)" specimens={ACTION_SPECIMENS} />
    </ReviewSection>
  );
}
