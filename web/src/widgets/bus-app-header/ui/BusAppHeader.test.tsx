import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { nearbyBusStopsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import type { GeoPosition } from '@/shared/lib';
import { BusAppHeader } from './BusAppHeader';

const BUS_STOPS_URL = `${env.apiBaseUrl}/v1/bus/stops`;
const SOL: GeoPosition = { lat: 40.41702, lng: -3.70243 };

function renderHeader() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BusAppHeader center={SOL} />
    </QueryClientProvider>,
  );
}

describe('BusAppHeader', () => {
  it('shows the freshness of the nearby bus stops', async () => {
    server.use(
      http.get(BUS_STOPS_URL, () =>
        HttpResponse.json({ ...nearbyBusStopsFixture, updatedAt: new Date().toISOString() }),
      ),
    );
    renderHeader();

    expect(await screen.findByText(/^Actualizado /)).toBeInTheDocument();
  });

  it('offers a retry when the nearby bus stops fail without data', async () => {
    server.use(
      http.get(BUS_STOPS_URL, () =>
        HttpResponse.json({ title: 'Failed', status: 500 }, { status: 500 }),
      ),
    );
    renderHeader();

    expect(await screen.findByText('Sin datos del servicio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
  });
});
