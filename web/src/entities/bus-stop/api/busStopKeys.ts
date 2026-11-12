import { NEAR_COORDINATE_DECIMALS } from '@/shared/config';
import type { GeoPosition } from '@/shared/lib';

// Key and request share this value, so a cached list always matches what was asked for.
export function toNearParam({ lat, lng }: GeoPosition): string {
  return `${lat.toFixed(NEAR_COORDINATE_DECIMALS)},${lng.toFixed(NEAR_COORDINATE_DECIMALS)}`;
}

export const busStopKeys = {
  all: () => ['bus-stops', 'all'] as const,
  nearby: (center: GeoPosition | undefined) =>
    ['bus-stops', 'nearby', { near: center && toNearParam(center) }] as const,
  detail: (number: string | undefined) => ['bus-stops', 'detail', number] as const,
  arrivals: (number: string | undefined) => ['bus-stops', 'arrivals', number] as const,
};
