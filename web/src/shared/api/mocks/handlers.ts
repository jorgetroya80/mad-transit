import type {
  Problem,
  StationDetailResponse,
  StationsResponse,
} from '@jorgetroya80/mad-transit-client';
import { http, HttpResponse } from 'msw';
import { env } from '@/shared/config';
import { nearbyStationsFixture, stationNotFoundProblem, stationsFixture } from './fixtures';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;

function findStation(number: string) {
  const wanted = number.toLowerCase();
  return stationsFixture.stations.find((station) => station.number.toLowerCase() === wanted);
}

type HandlerOptions = {
  // Dates every response; without it the fixtures keep their fixed date, which tests rely on.
  updatedAt?: () => string;
};

// Every API error is a problem+json body with its own status.
export function problemResponse(problem: Problem) {
  return HttpResponse.json<Problem>(problem, {
    status: problem.status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

// The API writes `updatedAt` in whole seconds.
export function apiTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function createHandlers({ updatedAt }: HandlerOptions = {}) {
  const dated = <T extends { updatedAt: string }>(response: T): T =>
    updatedAt ? { ...response, updatedAt: updatedAt() } : response;

  return [
    http.get<never, never, StationsResponse>(STATIONS_URL, ({ request }) => {
      const near = new URL(request.url).searchParams.has('near');
      return HttpResponse.json(dated(near ? nearbyStationsFixture : stationsFixture));
    }),
    http.get<{ number: string }, never, StationDetailResponse | Problem>(
      `${STATIONS_URL}/:number`,
      ({ params }) => {
        const station = findStation(params.number);
        if (!station) return problemResponse(stationNotFoundProblem(params.number));
        const { updatedAt: fixtureUpdatedAt, stale, source } = stationsFixture;
        return HttpResponse.json(dated({ station, updatedAt: fixtureUpdatedAt, stale, source }));
      },
    ),
  ];
}

export const handlers = createHandlers();
