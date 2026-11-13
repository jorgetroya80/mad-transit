import type { Need } from '@/entities/station';
import type { Service } from '@/features/select-service';

// The router keeps the URL value of any key the validator leaves out, so the keys come back as
// undefined. BiciMAD is the default, so the service is only set for bus.
export type MapSearch = {
  station?: string | undefined;
  need: Need;
  service?: Service | undefined;
  stop?: string | undefined;
};

function parseNumber(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function parseNeed(value: unknown): Need {
  return value === 'docks' ? 'docks' : 'bikes';
}

function parseService(value: unknown): Service | undefined {
  return value === 'bus' ? 'bus' : undefined;
}

// A stop only means something with the bus service, so it is dropped under any other.
export function validateMapSearch(raw: Record<string, unknown>): MapSearch {
  const service = parseService(raw.service);
  return {
    station: parseNumber(raw.station),
    need: parseNeed(raw.need),
    service,
    stop: service === 'bus' ? parseNumber(raw.stop) : undefined,
  };
}
