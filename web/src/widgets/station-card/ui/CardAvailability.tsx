import {
  availabilityFor,
  availabilityLabel,
  availabilitySpokenText,
  availabilityStatusText,
  availabilityTone,
  type Need,
  type Station,
} from '@/entities/station';
import { StatTile } from '@/shared/ui';
import { type DataStatus } from '@/shared/lib';

type CardAvailabilityProps = { station: Station; status: DataStatus };

// Both counts whatever the mode: the card answers «can I take one and can I leave one».
const CAPTIONS = {
  bikes: 'bicis disponibles',
  docks: 'anclajes libres',
} as const satisfies Record<Need, string>;

const NEEDS = ['bikes', 'docks'] as const satisfies readonly Need[];

// The hidden term names each count; the tile's srText reads it with its status.
export function CardAvailability({ station, status }: CardAvailabilityProps) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {NEEDS.map((need) => {
        const availability = availabilityFor(station, need, status);
        const { level, count } = availability;
        return (
          <div key={need}>
            <dt className="sr-only">{CAPTIONS[need]}</dt>
            <dd>
              <StatTile
                value={availabilityLabel(availability)}
                label={CAPTIONS[need]}
                tone={availabilityTone(level)}
                statusLabel={availabilityStatusText(level, need)}
                srText={availabilitySpokenText(level, count, need)}
              />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
