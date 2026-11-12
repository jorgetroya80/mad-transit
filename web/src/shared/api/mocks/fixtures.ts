import type {
  BusArrivalResponse,
  BusLineResponse,
  BusStopArrivalsResponse,
  BusStopDetailResponse,
  BusStopResponse,
  BusStopsResponse,
  Problem,
  Station,
  StationsResponse,
} from '@jorgetroya80/mad-transit-client';

// Bikes cover every availability level: good (12), low (2), empty (0) and off (NO_SERVICE).
const puertaDelSolA: Station = {
  id: 1,
  number: '1a',
  name: 'Puerta del Sol A',
  address: 'Puerta del Sol nº 1',
  lat: 40.4170224,
  lon: -3.7024255,
  status: 'OPERATIONAL',
  bikes: 12,
  freeDocks: 12,
  totalDocks: 24,
  occupancy: 'MEDIUM',
};

const puertaDelSolB: Station = {
  id: 2,
  number: '1b',
  name: 'Puerta del Sol B',
  address: 'Puerta del Sol nº 1',
  lat: 40.4171037,
  lon: -3.7025031,
  status: 'OPERATIONAL',
  bikes: 2,
  freeDocks: 22,
  totalDocks: 24,
  occupancy: 'LOW',
};

const miguelMoya: Station = {
  id: 3,
  number: '2',
  name: 'Miguel Moya',
  address: 'Calle Miguel Moya nº 1',
  lat: 40.4205886,
  lon: -3.7058415,
  status: 'NO_SERVICE',
  bikes: 0,
  freeDocks: 0,
  totalDocks: 24,
  occupancy: 'UNKNOWN',
};

const condeSuchil: Station = {
  id: 4,
  number: '3',
  name: 'Plaza Conde Suchil',
  address: 'Plaza del Conde del Valle de Suchil nº 3',
  lat: 40.4302937,
  lon: -3.7069171,
  status: 'OPERATIONAL',
  bikes: 0,
  freeDocks: 18,
  totalDocks: 18,
  occupancy: 'LOW',
};

export const stationsFixture: StationsResponse = {
  stations: [puertaDelSolA, puertaDelSolB, miguelMoya, condeSuchil],
  updatedAt: '2026-10-13T10:15:00Z',
  stale: false,
  source: 'EMT Madrid MobilityLabs',
};

export const staleStationsFixture: StationsResponse = {
  ...stationsFixture,
  updatedAt: '2026-10-13T09:45:00Z',
  stale: true,
};

// The `?near=` answer around Puerta del Sol: only stations within the radius, closest first.
export const nearbyStationsFixture: StationsResponse = {
  ...stationsFixture,
  stations: [
    { ...puertaDelSolA, distanceMeters: 12 },
    { ...puertaDelSolB, distanceMeters: 18 },
    { ...miguelMoya, distanceMeters: 420 },
  ],
};

const solStop: BusStopResponse = {
  number: '72',
  name: 'Puerta del Sol',
  lat: 40.4168,
  lon: -3.7038,
  lines: ['3', 'N1'],
};

export const busStopsFixture: BusStopsResponse = {
  stops: [solStop],
  updatedAt: '2026-10-13T10:15:00Z',
  stale: false,
  source: 'EMT Madrid MobilityLabs',
};

export const nearbyBusStopsFixture: BusStopsResponse = {
  ...busStopsFixture,
  stops: [{ ...solStop, distanceMeters: 12 }],
};

const line3: BusLineResponse = {
  label: '3',
  headerA: 'Puerta del Sol',
  headerB: 'Legazpi',
  direction: 'A',
  firstBus: '06:30',
  lastBus: '23:00',
  minFrequencyMinutes: 8,
  maxFrequencyMinutes: 12,
};

// Night lines cross midnight: the last bus is earlier than the first.
const lineN1: BusLineResponse = {
  label: 'N1',
  headerA: 'Puerta del Sol',
  headerB: 'Cibeles',
  direction: 'B',
  firstBus: '23:30',
  lastBus: '05:30',
  minFrequencyMinutes: 20,
  maxFrequencyMinutes: 30,
};

export const busStopDetailFixture: BusStopDetailResponse = {
  stop: {
    number: solStop.number,
    name: solStop.name,
    address: 'Puerta del Sol nº 1',
    lat: solStop.lat,
    lon: solStop.lon,
    lines: [line3, lineN1],
  },
  updatedAt: '2026-10-13T10:15:00Z',
  stale: false,
  source: 'EMT Madrid MobilityLabs',
};

// Soonest first, and the ones without an estimate last.
export const arrivingArrival: BusArrivalResponse = {
  line: 'N1',
  destination: 'Cibeles',
  minutes: 0,
  noEstimate: false,
  distanceMeters: 35,
  busLat: 40.4166,
  busLon: -3.7037,
};

export const soonArrival: BusArrivalResponse = {
  line: '3',
  destination: 'Legazpi',
  minutes: 2,
  noEstimate: false,
  distanceMeters: 640,
  busLat: 40.4131,
  busLon: -3.7052,
};

export const noEstimateArrival: BusArrivalResponse = {
  line: '3',
  destination: 'Legazpi',
  minutes: null,
  noEstimate: true,
  distanceMeters: null,
  busLat: null,
  busLon: null,
};

export const busArrivalsFixture: BusStopArrivalsResponse = {
  arrivals: [arrivingArrival, soonArrival, noEstimateArrival],
  updatedAt: '2026-10-13T10:15:00Z',
  stale: false,
  source: 'EMT Madrid MobilityLabs',
};

// The bodies of the API's ProblemDetailsHandler, with a fixed request id.
const REQUEST_ID = 'mock-request';

export function notFoundProblem(instance: string): Problem {
  return {
    type: 'about:blank',
    title: 'Not Found',
    status: 404,
    detail: 'Not Found',
    instance,
    requestId: REQUEST_ID,
  };
}

export function stationNotFoundProblem(number: string): Problem {
  return notFoundProblem(`/v1/bicimad/stations/${number}`);
}

// EMT Madrid failed or could not be reached.
export function emtUnavailableProblem(instance: string): Problem {
  return {
    type: 'urn:mad-transit:problem:emt-unavailable',
    title: 'EMT unavailable',
    status: 503,
    detail: 'EMT Madrid is not available right now.',
    instance,
    requestId: REQUEST_ID,
  };
}

export function internalErrorProblem(instance: string): Problem {
  return {
    type: 'urn:mad-transit:problem:internal',
    title: 'Internal error',
    status: 500,
    detail: 'An unexpected error occurred.',
    instance,
    requestId: REQUEST_ID,
  };
}

export function rateLimitedProblem(instance: string): Problem {
  return {
    type: 'urn:mad-transit:problem:rate-limited',
    title: 'Too many requests',
    status: 429,
    detail: 'Too many requests from this client; retry later.',
    instance,
    requestId: REQUEST_ID,
  };
}

// EMT Madrid answered, but not in the shape the API expects.
export function emtBadResponseProblem(instance: string): Problem {
  return {
    type: 'urn:mad-transit:problem:emt-bad-response',
    title: 'EMT error',
    status: 502,
    detail: 'EMT Madrid returned an unexpected response.',
    instance,
    requestId: REQUEST_ID,
  };
}
