import type { BusArrivalResponse } from '@jorgetroya80/mad-transit-client';

export type {
  BusArrivalResponse as Arrival,
  BusLineResponse as BusLine,
  BusStopInfoResponse as BusStopInfo,
  BusStopResponse as BusStop,
} from '@jorgetroya80/mad-transit-client';

// The line and the destination are what tell one arrival from another.
export type ArrivalRef = Pick<BusArrivalResponse, 'line' | 'destination'>;
