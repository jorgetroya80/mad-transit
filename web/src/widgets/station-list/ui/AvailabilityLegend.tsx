import { useId } from 'react';

// Same order, colors and dashed empty border as the badges in the rows. Full class names so
// Tailwind finds them; the unconfirmed grey gets a line so it shows on the white panel.
const LEVELS = [
  { label: '5 o más', swatch: 'bg-availability-good' },
  { label: '1 a 4', swatch: 'bg-availability-low' },
  {
    label: 'Vacía',
    swatch: 'bg-availability-empty border-2 border-dashed border-availability-empty-line',
  },
  { label: 'Fuera de servicio', swatch: 'bg-availability-off' },
  {
    label: 'Sin confirmar',
    swatch: 'bg-availability-unconfirmed border border-availability-unconfirmed-line',
  },
] as const;

export function AvailabilityLegend() {
  const headingId = useId();
  return (
    <div>
      <h2 id={headingId} className="sr-only">
        Leyenda
      </h2>
      <ul aria-labelledby={headingId} className="flex flex-wrap gap-x-4 gap-y-2">
        {LEVELS.map(({ label, swatch }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span aria-hidden="true" className={`size-3.5 shrink-0 rounded-full ${swatch}`} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
