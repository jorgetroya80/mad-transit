import type { ComponentProps } from 'react';
import { CountBadge } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type CountBadgeProps = ComponentProps<typeof CountBadge>;
type BadgeTone = CountBadgeProps['tone'];

// The board's figure for each tone.
const TONE_VALUES = [
  ['success', '12'],
  ['warning', '3'],
  ['danger', '0'],
  ['neutral', '–'],
  ['muted', '3'],
  ['info', '2'],
] as const satisfies readonly (readonly [BadgeTone, string])[];

function toneSpecimens(size: NonNullable<CountBadgeProps['size']>): Specimen[] {
  return TONE_VALUES.map(([tone, value]) => ({
    caption: `${tone} · ${size}`,
    piece: <CountBadge tone={tone} value={value} size={size} />,
  }));
}

const OTHER_SPECIMENS: Specimen[] = [
  {
    caption: 'info · srText (avisos)',
    piece: <CountBadge tone="info" value="2" srText="2 avisos sin leer" />,
  },
  { caption: 'Cargando · md', piece: <CountBadge tone="success" value="12" loading /> },
  { caption: 'Cargando · sm', piece: <CountBadge tone="success" value="12" size="sm" loading /> },
];

export function CountBadgeSection() {
  return (
    <ReviewSection title="CountBadge">
      <SpecimenRow title='Tonos · size="md" (escritorio)' specimens={toneSpecimens('md')} />
      <SpecimenRow title='Tonos · size="sm" (móvil)' specimens={toneSpecimens('sm')} />
      <SpecimenRow title="Con texto para el lector y cargando" specimens={OTHER_SPECIMENS} />
    </ReviewSection>
  );
}
