import {
  AvailabilityBadge,
  availabilityFor,
  type DataStatus,
  type Need,
  type Station,
} from '@/entities/station';

type CardAvailabilityProps = { station: Station; status: DataStatus };

// Both counts whatever the mode: the card answers «can I take one and can I leave one».
const CAPTIONS = {
  bikes: 'bicis disponibles',
  docks: 'anclajes libres',
} as const satisfies Record<Need, string>;

const NEEDS = ['bikes', 'docks'] as const satisfies readonly Need[];

export function CardAvailability({ station, status }: CardAvailabilityProps) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {NEEDS.map((need) => {
        const { level, count } = availabilityFor(station, need, status);
        return (
          <div
            key={need}
            className="flex flex-col items-center gap-1 rounded-control bg-chip px-3 py-2.5"
          >
            <dt className="sr-only">{CAPTIONS[need]}</dt>
            <dd>
              <AvailabilityBadge level={level} count={count} need={need} align="center" />
            </dd>
            <dd aria-hidden="true" className="text-center text-sm text-fg-muted">
              {CAPTIONS[need]}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
