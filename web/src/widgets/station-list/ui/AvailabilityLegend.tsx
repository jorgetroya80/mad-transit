import { Legend } from '@/shared/ui';

// Same order and tones as the badges in the rows; empty keeps its dashed line.
const LEVELS = [
  { tone: 'success', text: '5 o más' },
  { tone: 'warning', text: '1 a 4' },
  { tone: 'danger', text: 'Vacía' },
  { tone: 'neutral', text: 'Fuera de servicio' },
  { tone: 'muted', text: 'Sin confirmar' },
] as const;

// The hidden heading keeps the panel's outline; the list takes the same name from its label.
export function AvailabilityLegend() {
  return (
    <div>
      <h2 className="sr-only">Leyenda</h2>
      <Legend label="Leyenda" items={LEVELS} />
    </div>
  );
}
