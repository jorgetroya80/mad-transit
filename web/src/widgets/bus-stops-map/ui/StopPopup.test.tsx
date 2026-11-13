import { screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import {
  arrivingArrival,
  busArrivalsFixture,
  noEstimateArrival,
  soonArrival,
} from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { StopPopup } from './StopPopup';

const ARRIVALS_URL = `${env.apiBaseUrl}/v1/bus/stops/:number/arrivals`;

function renderPopup(...children: ReactNode[]) {
  return renderWithRouter(<>{children}</>, { initialEntries: ['/?service=bus&stop=72'] });
}

function arrivalsRequests() {
  const urls: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('/arrivals')) urls.push(request.url);
  });
  return urls;
}

afterEach(() => server.events.removeAllListeners());

describe('StopPopup', () => {
  it('shows the number, name and lines of the stop', async () => {
    await renderPopup(<StopPopup number="72" />);

    expect(await screen.findByText('Puerta del Sol')).toBeInTheDocument();
    expect(screen.getByText('Parada 72')).toBeInTheDocument();
    const lines = screen.getByRole('list', { name: 'Líneas de la parada' });
    expect(
      within(lines)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['3', 'N1']);
  });

  it('shows the first three arrivals as line, destination and time', async () => {
    const sanAmaro = { ...soonArrival, destination: 'San Amaro', minutes: 9 };
    server.use(
      http.get(ARRIVALS_URL, () =>
        HttpResponse.json({
          ...busArrivalsFixture,
          arrivals: [arrivingArrival, soonArrival, noEstimateArrival, sanAmaro],
        }),
      ),
    );

    await renderPopup(<StopPopup number="72" />);

    const arrivals = await screen.findByRole('list', { name: 'Próximas llegadas' });
    expect(
      within(arrivals)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['N1 → Cibeles · Llegando', '3 → Legazpi · 2 min', '3 → Legazpi · Sin estimación']);
  });

  it('says the arrivals are not available when they cannot be loaded', async () => {
    server.use(
      http.get(ARRIVALS_URL, () =>
        HttpResponse.json({ title: 'Failed', status: 502 }, { status: 502 }),
      ),
    );

    await renderPopup(<StopPopup number="72" />);

    expect(await screen.findByText('Llegadas no disponibles')).toBeInTheDocument();
  });

  it('shares the arrivals query, so two views of the same stop ask once', async () => {
    const urls = arrivalsRequests();

    await renderPopup(<StopPopup number="72" />, <StopPopup number="72" />);
    await screen.findAllByRole('list', { name: 'Próximas llegadas' });

    expect(urls).toHaveLength(1);
  });
});
