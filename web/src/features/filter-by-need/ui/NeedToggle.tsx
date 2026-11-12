import type { ComponentProps } from 'react';
import type { Need } from '@/entities/station';
import { SegmentedControl } from '@/shared/ui';
import { useNeed } from '../model/useNeed';

type NeedToggleVariant = 'cards' | 'pill';

type NeedToggleProps = { variant: NeedToggleVariant };

type NeedOption = ComponentProps<typeof SegmentedControl<Need>>['options'][number];

// Only the cards show the description, and the floating pill draws no icons.
const OPTIONS = {
  cards: [
    { value: 'bikes', label: 'Sacar bici', description: 'Bicis disponibles', icon: 'bike' },
    { value: 'docks', label: 'Dejar bici', description: 'Anclajes libres', icon: 'dock' },
  ],
  pill: [
    { value: 'bikes', label: 'Sacar bici' },
    { value: 'docks', label: 'Dejar bici' },
  ],
} as const satisfies Record<NeedToggleVariant, readonly NeedOption[]>;

export function NeedToggle({ variant }: NeedToggleProps) {
  const [need, setNeed] = useNeed();

  return (
    <SegmentedControl
      label="¿Qué quieres hacer?"
      options={OPTIONS[variant]}
      value={need}
      onChange={setNeed}
      variant={variant}
    />
  );
}
