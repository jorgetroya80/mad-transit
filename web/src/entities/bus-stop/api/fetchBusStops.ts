import {
  type BusStopArrivalsResponse,
  type BusStopDetailResponse,
  type BusStopsResponse,
  getBusStop,
  getBusStopArrivals,
  listBusStops,
} from '@jorgetroya80/mad-transit-client';
import { apiClient, withTimeout } from '@/shared/api';
import { NEARBY_RADIUS_M } from '@/shared/config';
import { BusRequestError } from './BusRequestError';

type RequestOptions = { signal: AbortSignal };

export async function fetchAllBusStops({ signal }: RequestOptions): Promise<BusStopsResponse> {
  const result = await listBusStops({ client: apiClient, signal: withTimeout(signal) });
  if (result.error) throw new BusRequestError(result);
  return result.data;
}

export async function fetchNearbyBusStops({
  near,
  signal,
}: RequestOptions & { near: string }): Promise<BusStopsResponse> {
  const result = await listBusStops({
    client: apiClient,
    query: { near, radius: NEARBY_RADIUS_M },
    signal: withTimeout(signal),
  });
  if (result.error) throw new BusRequestError(result);
  return result.data;
}

export async function fetchBusStop({
  number,
  signal,
}: RequestOptions & { number: string }): Promise<BusStopDetailResponse> {
  const result = await getBusStop({
    client: apiClient,
    path: { number },
    signal: withTimeout(signal),
  });
  if (result.error) throw new BusRequestError(result);
  return result.data;
}

export async function fetchBusArrivals({
  number,
  signal,
}: RequestOptions & { number: string }): Promise<BusStopArrivalsResponse> {
  const result = await getBusStopArrivals({
    client: apiClient,
    path: { number },
    signal: withTimeout(signal),
  });
  if (result.error) throw new BusRequestError(result);
  return result.data;
}
