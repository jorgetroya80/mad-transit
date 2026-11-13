import type { ComponentProps } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { busStopDetailFixture, busStopsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import type { GeoPosition } from '@/shared/lib';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { findStaleNotice } from '../../../../test/staleNotice';
import { BusStopDetail } from './BusStopDetail';

const BUS_STOPS_URL = `${env.apiBaseUrl}/v1/bus/stops`;
const SOL: GeoPosition = { lat: 40.41702, lng: -3.70243 };
const BAD_GATEWAY = 502;
const UNAVAILABLE = 503;
const TOO_MANY_REQUESTS = 429;
const RETRY_AFTER_SECONDS = '60';
const FAILURE_TEXT = 'No se pudo cargar la parada';

type DetailProps = Partial<ComponentProps<typeof BusStopDetail>>;

function renderDetail(number = '72', props: DetailProps = {}) {
  return renderWithRouter(
    <BusStopDetail number={number} center={SOL} layout="desktop" {...props} />,
    { initialEntries: [`/?service=bus&stop=${number}`] },
  );
}

function respondDetail(resolver: () => Response) {
  server.use(http.get(`${BUS_STOPS_URL}/:number`, resolver));
}

function failDetail(status: number, headers: Record<string, string> = {}) {
  respondDetail(() => HttpResponse.json({ title: 'Failed', status }, { status, headers }));
}

function linesOf(layout: 'desktop' | 'mobile') {
  return screen.findByRole(layout === 'desktop' ? 'table' : 'list', {
    name: 'Líneas de la parada',
  });
}

describe('BusStopDetail', () => {
  it('shows the number, name, address and the distance from the nearby stops', async () => {
    await renderDetail();

    expect(await screen.findByRole('heading', { name: 'Puerta del Sol' })).toBeInTheDocument();
    expect(screen.getByText('Parada 72 · 12 m')).toBeInTheDocument();
    expect(screen.getByText('Puerta del Sol nº 1')).toBeInTheDocument();
  });

  it('shows no distance for a stop beyond the nearby radius', async () => {
    server.use(http.get(BUS_STOPS_URL, () => HttpResponse.json({ ...busStopsFixture, stops: [] })));

    await renderDetail();

    expect(await screen.findByRole('heading', { name: 'Puerta del Sol' })).toBeInTheDocument();
    expect(screen.getByText('Parada 72')).toBeInTheDocument();
  });

  it('lists the lines in a table with the four columns on desktop', async () => {
    await renderDetail('72', { layout: 'desktop' });

    const table = await linesOf('desktop');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'Línea',
      'Hacia',
      'Horario',
      'Cada',
    ]);
    const day = within(table).getByRole('row', { name: /Puerta del Sol 06:30/ });
    expect(within(day).getByText('3')).toBeInTheDocument();
    expect(within(day).getByRole('cell', { name: '8–12 min' })).toBeInTheDocument();
  });

  it('lists one row per line on mobile', async () => {
    await renderDetail('72', { layout: 'mobile' });

    const list = await linesOf('mobile');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it.each(['desktop', 'mobile'] as const)(
    'shows the same line data on %s, with the night line in text',
    async (layout) => {
      await renderDetail('72', { layout });

      const lines = await linesOf(layout);
      expect(within(lines).getByText('Cibeles')).toBeInTheDocument();
      expect(within(lines).getByText('23:30–05:30')).toBeInTheDocument();
      expect(within(lines).getByText('Nocturno')).toBeInTheDocument();
      expect(within(lines).getByText(/8–12 min/)).toBeInTheDocument();
      expect(within(lines).getAllByText('Nocturno')).toHaveLength(1);
    },
  );

  it('shows a 404 as not found, without retry, and goes back to the list', async () => {
    const user = userEvent.setup();
    const { router } = await renderDetail('99999999');

    expect(
      await screen.findByRole('heading', { name: 'Parada no encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Volver a la lista' }));

    expect(router.state.location.href).toBe('/?service=bus');
  });

  it('closes the detail with its back button', async () => {
    const user = userEvent.setup();
    const { router } = await renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Volver a la lista' }));

    expect(router.state.location.href).toBe('/?service=bus');
  });

  it('keeps the stop with a stale notice when the API says it is old', async () => {
    respondDetail(() => HttpResponse.json({ ...busStopDetailFixture, stale: true }));

    await renderDetail();

    expect(await screen.findByRole('heading', { name: 'Puerta del Sol' })).toBeInTheDocument();
    expect(await findStaleNotice()).toBeInTheDocument();
  });

  it('offers a retry after a failure, and shows the stop when it works', async () => {
    const user = userEvent.setup();
    let calls = 0;
    respondDetail(() => {
      calls += 1;
      return calls === 1
        ? HttpResponse.json({ title: 'Bad Gateway', status: BAD_GATEWAY }, { status: BAD_GATEWAY })
        : HttpResponse.json(busStopDetailFixture);
    });

    await renderDetail();

    expect(await screen.findByText(FAILURE_TEXT)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Puerta del Sol' })).toBeInTheDocument();
  });

  it('offers a retry when there is no response at all', async () => {
    respondDetail(() => HttpResponse.error());

    await renderDetail();

    expect(await screen.findByText(FAILURE_TEXT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
  });

  it.each([
    ['503', UNAVAILABLE],
    ['429', TOO_MANY_REQUESTS],
  ])('keeps "Reintentar" waiting for Retry-After after a %s', async (_status, status) => {
    failDetail(status, { 'Retry-After': RETRY_AFTER_SECONDS });

    await renderDetail();

    expect(await screen.findByText(FAILURE_TEXT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeDisabled();
  });
});
