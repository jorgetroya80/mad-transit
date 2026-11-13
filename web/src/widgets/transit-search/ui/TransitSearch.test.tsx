import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onlineManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type {
  BusStopResponse,
  BusStopsResponse,
  Station,
  StationsResponse,
} from '@jorgetroya80/mad-transit-client';
import { busStopsFixture, stationsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env, SEARCH_MAX_RESULTS } from '@/shared/config';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { TransitSearch } from './TransitSearch';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const BUS_STOPS_URL = `${env.apiBaseUrl}/v1/bus/stops`;
const UNAVAILABLE = 503;
const SOL = { lat: 40.41702, lng: -3.70243 };
// The app's QueryClient retries once after react-query's 1 s backoff.
const AFTER_RETRY = { timeout: 3_000 };

function fixtureStation(): Station {
  const [station] = stationsFixture.stations;
  if (!station) throw new Error('The fixtures need at least one station');
  return station;
}

// More stations starting with '1' than fit in the results, listed out of order on purpose.
const MANY_NUMBERS = ['19', '2', '1b', '100', '12', '1a', '15', '11', '3', '13', '10', '14', '1'];
const BUS_NUMBERS = ['2769', '72', '2768'];

function stationNumbered(number: string, index: number): Station {
  return { ...fixtureStation(), id: index, number, name: `Estación ${number}` };
}

function respondAll(resolver: () => Response | Promise<Response>) {
  server.use(http.get(STATIONS_URL, resolver));
}

function serveStations(stations: Station[]) {
  const body: StationsResponse = { ...stationsFixture, stations };
  respondAll(() => HttpResponse.json(body));
}

function busStopNumbered(number: string): BusStopResponse {
  return { number, name: `Parada ${number}`, lat: SOL.lat, lon: SOL.lng, lines: ['27'] };
}

function serveBusStops(stops: BusStopResponse[]) {
  const body: BusStopsResponse = { ...busStopsFixture, stops };
  server.use(http.get(BUS_STOPS_URL, () => HttpResponse.json(body)));
}

function searchBox() {
  return screen.getByRole('searchbox', { name: 'Buscar estación' });
}

function resultNumbers() {
  return screen
    .queryAllByRole('listitem')
    .map((item) => item.querySelector('button')?.dataset.number);
}

function status() {
  return screen.getByRole('status');
}

async function renderSearch() {
  const user = userEvent.setup();
  const view = await renderWithRouter(<TransitSearch center={SOL} />);
  return { user, ...view };
}

// Typing before the stations arrive would only show "Cargando…".
async function renderLoadedSearch() {
  const view = await renderSearch();
  await view.user.type(searchBox(), '1');
  await screen.findByRole('list');
  await view.user.clear(searchBox());
  return view;
}

describe('TransitSearch', () => {
  afterEach(() => onlineManager.setOnline(true));

  it('searches BiciMAD stations without a service picker', async () => {
    await renderSearch();

    expect(searchBox()).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Servicio' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('lists stations by number prefix, in numeric order and at most the maximum', async () => {
    serveStations(MANY_NUMBERS.map(stationNumbered));
    const { user } = await renderLoadedSearch();

    await user.type(searchBox(), '1');

    expect(resultNumbers()).toEqual(['1', '1a', '1b', '10', '11', '12', '13', '14']);
    expect(resultNumbers()).toHaveLength(SEARCH_MAX_RESULTS);
  });

  it('shows the name and address of each station', async () => {
    const { user } = await renderLoadedSearch();

    await user.type(searchBox(), '1a');

    const [result] = within(screen.getByRole('list')).getAllByRole('button');
    expect(result).toHaveAccessibleName('1a, Puerta del Sol A, Puerta del Sol nº 1');
  });

  it.each(['1A', ' 1a '])('finds 1a when typing "%s"', async (typed) => {
    const { user } = await renderLoadedSearch();

    await user.type(searchBox(), typed);

    expect(resultNumbers()).toEqual(['1a']);
  });

  it('finds nothing by name', async () => {
    const { user } = await renderLoadedSearch();

    await user.type(searchBox(), 'sol');

    expect(resultNumbers()).toEqual([]);
    expect(screen.getByText('No hay ninguna estación «sol»')).toBeInTheDocument();
  });

  it('selects the clicked station in the URL', async () => {
    const { user, router } = await renderLoadedSearch();

    await user.type(searchBox(), '1');
    await user.click(screen.getByRole('button', { name: /^1b,/ }));

    await waitFor(() => expect(router.state.location.search).toEqual({ station: '1b' }));
    expect(searchBox()).toHaveValue('');
  });

  it('selects the exact match on Enter', async () => {
    const { user, router } = await renderLoadedSearch();

    await user.type(searchBox(), '1A{Enter}');

    await waitFor(() => expect(router.state.location.search).toEqual({ station: '1a' }));
  });

  it('says it is loading while the stations arrive', async () => {
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    respondAll(async () => {
      await released;
      return HttpResponse.json(stationsFixture);
    });
    const { user } = await renderSearch();

    await user.type(searchBox(), '1');

    expect(status()).toHaveTextContent('Cargando estaciones…');
    await act(async () => release());
    expect(await screen.findByRole('list')).toBeInTheDocument();
  });

  it('disables the box until the service answers when the request fails without data', async () => {
    respondAll(() =>
      HttpResponse.json(
        { title: 'Service Unavailable', status: UNAVAILABLE },
        { status: UNAVAILABLE },
      ),
    );
    await renderSearch();

    await waitFor(() => expect(searchBox()).toBeDisabled(), AFTER_RETRY);
    expect(searchBox()).toHaveAttribute('placeholder', 'No disponible hasta recuperar los datos');
    expect(searchBox()).toHaveAccessibleDescription('No disponible hasta recuperar los datos');
  });

  it('disables the box until the connection returns when offline without data', async () => {
    onlineManager.setOnline(false);
    await renderSearch();

    expect(searchBox()).toBeDisabled();
    expect(searchBox()).toHaveAttribute('placeholder', 'Disponible al volver a conectarte');

    act(() => onlineManager.setOnline(true));
    await waitFor(() => expect(searchBox()).toBeEnabled());
  });

  it('searches the saved stations offline, and says so in the box', async () => {
    const { user } = await renderLoadedSearch();

    act(() => onlineManager.setOnline(false));
    await user.type(searchBox(), '1a');

    expect(searchBox()).toHaveAttribute('placeholder', 'Busca entre las estaciones guardadas');
    expect(resultNumbers()).toEqual(['1a']);
  });

  describe('no results', () => {
    it('suggests the nearest station, and opens it like a result (SC5)', async () => {
      const { user, router } = await renderLoadedSearch();

      await user.type(searchBox(), '999');
      await user.click(await screen.findByRole('button', { name: '1a · Puerta del Sol A' }));

      await waitFor(() => expect(router.state.location.search).toEqual({ station: '1a' }));
    });

    it('only offers the nearby stations before there is a nearby list', async () => {
      const user = userEvent.setup();
      await renderWithRouter(<TransitSearch center={undefined} />);
      await waitFor(() => expect(searchBox()).toBeEnabled());

      await user.type(searchBox(), '999');

      expect(
        await screen.findByRole('button', { name: 'Ver estaciones cercanas' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /·/ })).not.toBeInTheDocument();
    });
  });

  describe('floating over the map', () => {
    async function renderFloatingSearch() {
      const user = userEvent.setup();
      const view = await renderWithRouter(<TransitSearch center={SOL} variant="floating" />);
      await user.type(searchBox(), '1');
      await screen.findByRole('list');
      await user.clear(searchBox());
      return { user, ...view };
    }

    it('is a 44 px pill with its shadow', async () => {
      await renderFloatingSearch();

      expect(searchBox()).toHaveClass('h-11', 'rounded-full', 'bg-surface', 'shadow-pill');
    });

    it('hides its label visually and keeps the help as its description', async () => {
      await renderFloatingSearch();

      expect(screen.getByText('Buscar estación')).toHaveClass('sr-only');
      expect(screen.getByText('Busca por número de estación.')).toHaveClass('sr-only');
      expect(searchBox()).toHaveAccessibleDescription('Busca por número de estación.');
    });

    it('opens the results over the map instead of pushing what follows', async () => {
      const { user } = await renderFloatingSearch();

      await user.type(searchBox(), '1a');

      expect(screen.getByRole('list').parentElement).toHaveClass('absolute', 'top-full');
    });

    it('selects the clicked station in the URL', async () => {
      const { user, router } = await renderFloatingSearch();

      await user.type(searchBox(), '1');
      await user.click(screen.getByRole('button', { name: /^1b,/ }));

      await waitFor(() => expect(router.state.location.search).toEqual({ station: '1b' }));
    });

    it('has no axe violations with the results open', async () => {
      const { user, container } = await renderFloatingSearch();

      await user.type(searchBox(), '1');

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('with Bus chosen', () => {
    const BUS_SEARCH = { initialEntries: ['/?service=bus'] };

    function stopSearchBox() {
      return screen.getByRole('searchbox', { name: 'Buscar parada' });
    }

    async function renderBusSearch() {
      const user = userEvent.setup();
      const view = await renderWithRouter(<TransitSearch center={SOL} />, BUS_SEARCH);
      return { user, ...view };
    }

    // Typing before the stops arrive would only show "Cargando paradas…".
    async function renderLoadedBusSearch() {
      serveBusStops(BUS_NUMBERS.map(busStopNumbered));
      const view = await renderBusSearch();
      await view.user.type(stopSearchBox(), '2');
      await screen.findByRole('list');
      await view.user.clear(stopSearchBox());
      return view;
    }

    it('searches bus stops by number, without a service picker', async () => {
      const { user } = await renderLoadedBusSearch();

      await user.type(stopSearchBox(), '276');

      expect(resultNumbers()).toEqual(['2768', '2769']);
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('shows the number and name of each stop', async () => {
      const { user } = await renderLoadedBusSearch();

      await user.type(stopSearchBox(), '2768');

      const [result] = within(screen.getByRole('list')).getAllByRole('button');
      expect(result).toHaveAccessibleName('2768, Parada 2768');
    });

    it('opens the stop typed in full on Enter, with ?stop pushed', async () => {
      const { user, router } = await renderLoadedBusSearch();

      await user.type(stopSearchBox(), '2768{Enter}');

      await waitFor(() =>
        expect(router.state.location.search).toEqual({ service: 'bus', stop: '2768' }),
      );
      await act(() => router.history.back());
      await waitFor(() => expect(router.state.location.search).toEqual({ service: 'bus' }));
    });

    it('says it is loading while the stops arrive', async () => {
      let release = () => {};
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      server.use(
        http.get(BUS_STOPS_URL, async () => {
          await released;
          return HttpResponse.json(busStopsFixture);
        }),
      );
      const { user } = await renderBusSearch();

      await user.type(stopSearchBox(), '7');

      expect(status()).toHaveTextContent('Cargando paradas…');
      await act(async () => release());
      expect(await screen.findByRole('list')).toBeInTheDocument();
    });

    it('disables the box until the service answers when the stops fail without data', async () => {
      server.use(
        http.get(BUS_STOPS_URL, () =>
          HttpResponse.json(
            { title: 'Service Unavailable', status: UNAVAILABLE },
            { status: UNAVAILABLE },
          ),
        ),
      );
      await renderBusSearch();

      await waitFor(() => expect(stopSearchBox()).toBeDisabled(), AFTER_RETRY);
      expect(stopSearchBox()).toHaveAttribute(
        'placeholder',
        'No disponible hasta recuperar los datos',
      );
    });

    it('disables the box until the connection returns when offline without data', async () => {
      onlineManager.setOnline(false);
      await renderBusSearch();

      expect(stopSearchBox()).toBeDisabled();
      expect(stopSearchBox()).toHaveAttribute('placeholder', 'Disponible al volver a conectarte');

      act(() => onlineManager.setOnline(true));
      await waitFor(() => expect(stopSearchBox()).toBeEnabled());
    });

    it('says no stop matches, and offers the nearby stops', async () => {
      const { user } = await renderLoadedBusSearch();

      await user.type(stopSearchBox(), '999');

      expect(screen.getByText('No hay ninguna parada «999»')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ver paradas cercanas' })).toBeInTheDocument();
    });

    it('finds no BiciMAD station with Bus chosen', async () => {
      serveStations([stationNumbered('1a', 0)]);
      const { user } = await renderLoadedBusSearch();

      await user.type(stopSearchBox(), '1a');

      expect(screen.getByText('No hay ninguna parada «1a»')).toBeInTheDocument();
    });

    it('does not ask for bus stops while BiciMAD is chosen', async () => {
      const busRequest = vi.fn<() => Response>(() => HttpResponse.json(busStopsFixture));
      server.use(http.get(BUS_STOPS_URL, busRequest));
      serveStations(MANY_NUMBERS.map(stationNumbered));
      const user = userEvent.setup();
      await renderWithRouter(<TransitSearch center={SOL} />);
      await user.type(searchBox(), '1');
      await screen.findByRole('list');

      expect(busRequest).not.toHaveBeenCalled();
    });
  });

  it('keeps its label in view by default', async () => {
    await renderSearch();

    expect(screen.getByText('Buscar estación')).not.toHaveClass('sr-only');
  });
});
