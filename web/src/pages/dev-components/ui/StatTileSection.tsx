import type { ComponentProps } from 'react';
import { StatTile } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type StatTileProps = ComponentProps<typeof StatTile>;

const BIKES = 'bicis disponibles';
const DOCKS = 'anclajes libres';

// The board draws each tile 160 px wide; on a screen the grid sets the width.
function sized(props: StatTileProps) {
  return (
    <div className="w-40">
      <StatTile {...props} />
    </div>
  );
}

const TONE_SPECIMENS: Specimen[] = [
  { caption: 'success', piece: sized({ tone: 'success', value: '12', label: BIKES }) },
  { caption: 'warning', piece: sized({ tone: 'warning', value: '3', label: BIKES }) },
  { caption: 'danger', piece: sized({ tone: 'danger', value: '0', label: DOCKS }) },
  {
    caption: 'muted + statusLabel',
    piece: sized({ tone: 'muted', value: '3', label: BIKES, statusLabel: 'Sin confirmar' }),
  },
  { caption: 'neutral', piece: sized({ tone: 'neutral', value: '–', label: DOCKS }) },
  {
    caption: 'info (otro dominio)',
    piece: sized({ tone: 'info', value: '4', label: 'minutos para el 27' }),
  },
  {
    caption: 'Cargando',
    piece: sized({ tone: 'success', value: '12', label: BIKES, loading: true }),
  },
];

const GRID_SPECIMENS: Specimen[] = [
  {
    caption: 'Dos en rejilla · srText',
    piece: (
      <div className="grid w-80 grid-cols-2 gap-2">
        <StatTile
          tone="warning"
          value="3"
          label={BIKES}
          srText="3 bicis disponibles, quedan pocas"
        />
        <StatTile tone="success" value="12" label={DOCKS} />
      </div>
    ),
  },
];

export function StatTileSection() {
  return (
    <ReviewSection title="StatTile">
      <SpecimenRow title="Tonos y cargando" specimens={TONE_SPECIMENS} />
      <SpecimenRow title="En la ficha" specimens={GRID_SPECIMENS} />
    </ReviewSection>
  );
}
