import type { ComponentProps } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { busStopsFixture, nearbyBusStopsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import type { GeoPosition } from '@/shared/lib';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { findStaleNotice } from '../../../../test/staleNotice';
import { BusStopList } from './BusStopList';

const BUS_STOPS_URL = `${env.apiBaseUrl}/v1/bus/stops`;
const SOL: GeoPosition = { lat: 40.41702, lng: -3.70243 };
const UNAVAILABLE = 503;
const TOO_MANY_REQUESTS = 429;
const BAD_GATEWAY = 502;
const FAILURE_TEXT = 'No se pudieron cargar las paradas cercanas';
const RETRY_AFTER_SECONDS = '60';

// Stop 72 at 12 m, as the API answers the nearby query around Sol.
const NEARBY_LABEL = 'Parada 72, Puerta del Sol, 12 metros, Líneas 3, N1';

type ListProps = Partial<ComponentProps<typeof BusStopList>>;

function renderList(props: ListProps = {}, initialEntry = '/?service=bus') {
  return renderWithRouter(
    <BusStopList
      center={SOL}
      isApproximateLocation={false}
      isLocationDenied={false}
      layout="desktop"
      onLocate={vi.fn<() => void>()}
      isLocating={false}
      {...props}
    />,
    { initialEntries: [initialEntry] },
  );
}

function respondNearby(resolver: () => Response) {
  server.use(
    http.get(BUS_STOPS_URL, ({ request }) => {
      return new URL(request.url).searchParams.has('near')
        ? resolver()
        : HttpResponse.json(busStopsFixture);
    }),
  );
}

function failNearby(status: number, headers: Record<string, string> = {}) {
  respondNearby(() => HttpResponse.json({ title: 'Failed', status }, { status, headers }));
}

function failingThenWorking() {
  let calls = 0;
  respondNearby(() => {
    calls += 1;
    return calls === 1
      ? HttpResponse.json(
          { title: 'Service Unavailable', status: UNAVAILABLE },
          { status: UNAVAILABLE },
        )
      : HttpResponse.json(nearbyBusStopsFixture);
  });
}

function retryButton() {
  return screen.getByRole('button', { name: 'Reintentar' });
}

describe('BusStopList', () => {
  it('lists the nearby stops with their number, name, lines and distance', async () => {
    await renderList();

    const row = await screen.findByRole('button', { name: NEARBY_LABEL });
    expect(within(row).getByText('Puerta del Sol')).toBeInTheDocument();
    expect(within(row).getByText('12 m')).toBeInTheDocument();
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText('N1')).toBeInTheDocument();
  });

  it('writes ?stop when a row is tapped', async () => {
    const user = userEvent.setup();
    const { router } = await renderList();

    await user.click(await screen.findByRole('button', { name: NEARBY_LABEL }));

    expect(router.state.location.href).toBe('/?service=bus&stop=72');
  });

  it('marks the row of the stop in ?stop', async () => {
    await renderList({}, '/?service=bus&stop=72');

    expect(await screen.findByRole('button', { name: NEARBY_LABEL })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('says when no stop is within 500 m', async () => {
    respondNearby(() => HttpResponse.json({ ...busStopsFixture, stops: [] }));

    await renderList();

    expect(await screen.findByText('Ninguna parada a 500 m')).toBeInTheDocument();
  });

  it('waits for the location before asking for the stops', async () => {
    await renderList({ center: undefined });

    expect(screen.getByText('Cargando paradas cercanas…')).toBeInTheDocument();
  });

  it('offers a retry after a failure, and shows the stops when it works', async () => {
    const user = userEvent.setup();
    failingThenWorking();

    await renderList();

    expect(await screen.findByText(FAILURE_TEXT)).toBeInTheDocument();
    await user.click(retryButton());

    expect(await screen.findByRole('button', { name: NEARBY_LABEL })).toBeInTheDocument();
  });

  it('retries a 502 at once', async () => {
    failNearby(BAD_GATEWAY);

    await renderList();

    expect(await screen.findByText(FAILURE_TEXT)).toBeInTheDocument();
    expect(retryButton()).toBeEnabled();
  });

  it.each([
    ['503', UNAVAILABLE],
    ['429', TOO_MANY_REQUESTS],
  ])('keeps "Reintentar" waiting for Retry-After after a %s', async (_status, status) => {
    failNearby(status, { 'Retry-After': RETRY_AFTER_SECONDS });

    await renderList();

    expect(await screen.findByText(FAILURE_TEXT)).toBeInTheDocument();
    expect(retryButton()).toBeDisabled();
  });

  it('keeps the stops with a stale notice when the API says they are old', async () => {
    respondNearby(() => HttpResponse.json({ ...nearbyBusStopsFixture, stale: true }));

    await renderList();

    await screen.findByRole('button', { name: NEARBY_LABEL });
    expect(await findStaleNotice()).toBeInTheDocument();
  });

  describe('location notice', () => {
    it('offers the location on desktop while the position is missing', async () => {
      const onLocate = vi.fn<() => void>();
      await renderList({ isApproximateLocation: true, onLocate });

      expect(
        screen.getByText(
          'Mostrando paradas cerca de la Puerta del Sol porque no tenemos tu ubicación.',
        ),
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }));
      expect(onLocate).toHaveBeenCalledOnce();
    });

    it('says the location is being asked for', async () => {
      await renderList({ isApproximateLocation: true, isLocating: true });

      expect(screen.getByRole('button', { name: 'Localizando…' })).toBeInTheDocument();
    });

    it('says the permission was denied, without an action', async () => {
      await renderList({ isApproximateLocation: true, isLocationDenied: true });

      expect(
        screen.getByText(
          'No has dado permiso de ubicación: mostrando paradas cerca de la Puerta del Sol',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /ubicación|Activar/ })).not.toBeInTheDocument();
    });

    it('asks for the location on mobile with the short text', async () => {
      await renderList({ layout: 'mobile', isApproximateLocation: true });

      expect(screen.getByText('Sin tu ubicación: cerca de la Puerta del Sol')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    });

    it('says which location the list uses when it is known', async () => {
      await renderList();

      expect(screen.getByText('Usando tu ubicación actual.')).toBeInTheDocument();
    });

    it('orders by distance on desktop only', async () => {
      const { unmount } = await renderList();
      expect(screen.getByText('Ordenadas por distancia')).toBeInTheDocument();
      unmount();

      await renderList({ layout: 'mobile' });
      expect(screen.queryByText('Ordenadas por distancia')).not.toBeInTheDocument();
    });
  });
});
