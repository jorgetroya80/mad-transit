import type { ComponentProps } from 'react';
import { Legend } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type LegendItem = ComponentProps<typeof Legend>['items'][number];

const EMPTY: LegendItem = { tone: 'danger', text: 'Vacía' };

function availability(empty: LegendItem): LegendItem[] {
  return [
    { tone: 'success', text: '5 o más' },
    { tone: 'warning', text: '1 a 4' },
    empty,
    { tone: 'neutral', text: 'Fuera de servicio' },
    { tone: 'muted', text: 'Sin confirmar' },
  ];
}

const STOPS: LegendItem[] = [
  { tone: 'neutral', text: 'Parada', shape: 'square' },
  { tone: 'info', text: 'Parada elegida', shape: 'square' },
];

const SPECIMENS: Specimen[] = [
  {
    caption: 'Leyenda del mapa · inline · danger con lineStyle="solid" (como el punto)',
    piece: (
      <div className="w-105 max-w-[calc(100vw-3rem)]">
        <Legend label="Leyenda del mapa" items={availability({ ...EMPTY, lineStyle: 'solid' })} />
      </div>
    ),
  },
  {
    caption: 'stacked · danger discontinuo (junto a CountBadge y StatTile)',
    piece: <Legend label="Leyenda del mapa" items={availability(EMPTY)} layout="stacked" />,
  },
  {
    caption: 'Otro dominio (paradas)',
    piece: <Legend label="Leyenda de paradas" items={STOPS} />,
  },
];

export function LegendSection() {
  return (
    <ReviewSection title="Legend">
      <SpecimenRow title="Variantes" specimens={SPECIMENS} />
    </ReviewSection>
  );
}
