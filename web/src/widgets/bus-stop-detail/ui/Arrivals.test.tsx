import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { apiTimestamp } from '@/shared/api/mocks/handlers';
import { busArrivalsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { Arrivals } from './Arrivals';

const ARRIVALS_URL = `${env.apiBaseUrl}/v1/bus/stops/:number/arrivals`;
const NOW = new Date('2026-11-13T10:00:00Z');
const FAILURE_TITLE = 'Llegadas no disponibles';
const QUOTA_TEXT =
  'Hoy se ha alcanzado el límite de consultas a la EMT. Las llegadas volverán solas; los horarios de abajo siguen siendo válidos.';
const RETRY_AFTER_SECONDS = '60';

function renderArrivals() {
  return renderWithRouter(<Arrivals number="72" />, { initialEntries: ['/?service=bus&stop=72'] });
}

function respondArrivals(resolver: () => Response) {
  server.use(http.get(ARRIVALS_URL, resolver));
}

function failArrivals(status: number, headers: Record<string, string> = {}) {
  respondArrivals(() => HttpResponse.json({ title: 'Failed', status }, { status, headers }));
}

function arrivalsList() {
  return screen.findByRole('list', { name: 'Llegadas' });
}

// Fresh data stamped with the fake clock, so its age is what the test sets.
function freshArrivals(onRequest?: () => void) {
  respondArrivals(() => {
    onRequest?.();
    return HttpResponse.json({ ...busArrivalsFixture, updatedAt: apiTimestamp(NOW) });
  });
}

function useFakeClock() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
}

describe('Arrivals', () => {
  it('lists the arrivals in the API order, with line, destination and time', async () => {
    await renderArrivals();

    const items = within(await arrivalsList()).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'N1CibelesLlegando',
      '3Legazpi2 min',
      '3LegazpiSin estimación',
    ]);
  });

  it('says there are no arrivals expected when the list is empty', async () => {
    respondArrivals(() => HttpResponse.json({ ...busArrivalsFixture, arrivals: [] }));

    await renderArrivals();

    expect(await screen.findByText('No hay autobuses previstos')).toBeInTheDocument();
  });

  it('shows how old the arrivals are when the API says they are stale', async () => {
    respondArrivals(() => HttpResponse.json({ ...busArrivalsFixture, stale: true }));

    await renderArrivals();

    expect(await screen.findByText(/Actualizado/)).toBeInTheDocument();
  });

  it.each([
    ['502', 502],
    ['503 without Retry-After', 503],
    ['504', 504],
    ['400', 400],
    ['500', 500],
  ])('says the arrivals are unavailable, with a retry, after a %s', async (_name, status) => {
    failArrivals(status);

    await renderArrivals();

    expect(await screen.findByText(FAILURE_TITLE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
  });

  it('says the arrivals are unavailable, with a retry, without a response', async () => {
    respondArrivals(() => HttpResponse.error());

    await renderArrivals();

    expect(await screen.findByText(FAILURE_TITLE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
  });

  it('explains the daily quota after a 503 with Retry-After, without a retry', async () => {
    failArrivals(503, { 'Retry-After': RETRY_AFTER_SECONDS });

    await renderArrivals();

    expect(await screen.findByText(QUOTA_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('keeps "Reintentar" waiting for Retry-After after a 429', async () => {
    failArrivals(429, { 'Retry-After': RETRY_AFTER_SECONDS });

    await renderArrivals();

    expect(await screen.findByText(FAILURE_TITLE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeDisabled();
  });

  it('shows the arrivals when the retry works', async () => {
    const user = userEvent.setup();
    let calls = 0;
    respondArrivals(() => {
      calls += 1;
      return calls === 1
        ? HttpResponse.json({ title: 'Bad Gateway', status: 502 }, { status: 502 })
        : HttpResponse.json(busArrivalsFixture);
    });

    await renderArrivals();
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await arrivalsList()).toBeInTheDocument();
  });

  describe('polling', () => {
    afterEach(() => {
      vi.useRealTimers();
      Reflect.deleteProperty(document, 'visibilityState');
    });

    it('asks for the arrivals again every 30 seconds while the stop is open', async () => {
      useFakeClock();
      let requests = 0;
      freshArrivals(() => {
        requests += 1;
      });

      await renderArrivals();
      await arrivalsList();
      expect(requests).toBe(1);
      await act(() => vi.advanceTimersByTimeAsync(30_000));

      expect(requests).toBe(2);
    });

    it('does not ask while the tab is hidden', async () => {
      useFakeClock();
      let requests = 0;
      freshArrivals(() => {
        requests += 1;
      });
      await renderArrivals();
      await arrivalsList();
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

      await act(() => vi.advanceTimersByTimeAsync(30_000));

      expect(requests).toBe(1);
    });

    it('keeps the last arrivals up to 2 minutes after a failed refresh, then says they are unavailable', async () => {
      useFakeClock();
      let failing = false;
      respondArrivals(() =>
        failing
          ? HttpResponse.json({ title: 'Bad Gateway', status: 502 }, { status: 502 })
          : HttpResponse.json({ ...busArrivalsFixture, updatedAt: apiTimestamp(NOW) }),
      );
      await renderArrivals();
      await arrivalsList();
      failing = true;

      await act(() => vi.advanceTimersByTimeAsync(60_000));
      expect(screen.getByText('2 min')).toBeInTheDocument();

      await act(() => vi.advanceTimersByTimeAsync(90_000));
      expect(screen.queryByText('2 min')).not.toBeInTheDocument();
      expect(screen.getByText(FAILURE_TITLE)).toBeInTheDocument();
    });
  });
});
