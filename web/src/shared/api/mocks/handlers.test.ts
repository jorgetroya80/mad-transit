import { getStation, listStations } from '@jorgetroya80/mad-transit-client';
import { apiClient } from '../client';
import { http } from 'msw';
import {
  emtUnavailableProblem,
  internalErrorProblem,
  stationNotFoundProblem,
  stationsFixture,
} from './fixtures';
import { apiTimestamp, createHandlers, problemResponse } from './handlers';
import { server } from './node';

const NOW = '2026-10-31T16:45:12Z';

describe('createHandlers', () => {
  it('keeps the fixture dates by default, so tests stay deterministic', async () => {
    const { data } = await listStations({ client: apiClient });

    expect(data?.updatedAt).toBe(stationsFixture.updatedAt);
  });

  it('dates every response with the given clock', async () => {
    server.use(...createHandlers({ updatedAt: () => NOW }));

    const list = await listStations({ client: apiClient });
    const nearby = await listStations({
      client: apiClient,
      query: { near: '40.4170,-3.7024', radius: 500, need: 'bikes' },
    });
    const detail = await getStation({ client: apiClient, path: { number: '1a' } });

    expect(list.data?.updatedAt).toBe(NOW);
    expect(nearby.data?.updatedAt).toBe(NOW);
    expect(detail.data?.updatedAt).toBe(NOW);
  });
});

describe('apiTimestamp', () => {
  it('writes the date in whole seconds, like the API', () => {
    expect(apiTimestamp(new Date('2026-10-31T16:45:12.789Z'))).toBe(NOW);
  });
});

// The API's ProblemDetailsHandler: EMT down is a 503, anything unexpected a 500.
describe('problem mocks', () => {
  it.each([
    [emtUnavailableProblem('/v1/bicimad/stations'), 503, 'urn:mad-transit:problem:emt-unavailable'],
    [internalErrorProblem('/v1/bicimad/stations/1a'), 500, 'urn:mad-transit:problem:internal'],
  ])('answers %o as the API does', async (problem, status, type) => {
    server.use(http.get('*/v1/bicimad/stations', () => problemResponse(problem)));

    const { error, response } = await listStations({ client: apiClient });

    expect(response?.status).toBe(status);
    expect(response?.headers.get('Content-Type')).toBe('application/problem+json');
    expect(error).toEqual(problem);
    expect(problem).toMatchObject({ type, status, requestId: 'mock-request' });
  });
});

// As the local API answered on 2026-11-12: a missing station keeps Spring's reason phrase.
describe('stationNotFoundProblem', () => {
  it('answers a missing station as the API does', async () => {
    const { error, response } = await getStation({ client: apiClient, path: { number: '999' } });

    expect(response?.status).toBe(404);
    expect(error).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Not Found',
      instance: '/v1/bicimad/stations/999',
      requestId: 'mock-request',
    });
    expect(stationNotFoundProblem('999')).toEqual(error);
  });
});
