import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/shared/api/mocks/node';
import type * as SharedUi from '@/shared/ui';
import { stubMatchMedia } from '../../../../test/matchMedia';
import { renderWithRouter } from '../../../../test/renderWithRouter';

// jsdom has no WebGL: the map is a plain element here.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: () => <div data-testid="base-map" />,
}));

const USER = { lat: 40.4169, lng: -3.7033 };

function stubGeolocation() {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: (onSuccess: PositionCallback) =>
        onSuccess({ coords: { latitude: USER.lat, longitude: USER.lng } } as GeolocationPosition),
    },
    configurable: true,
  });
}

function renderDesktop() {
  return renderWithRouter(undefined, { initialEntries: ['/?service=bus'] });
}

describe('BusDesktopPage', () => {
  beforeEach(() => {
    stubMatchMedia(true);
    stubGeolocation();
  });

  afterEach(() => {
    server.events.removeAllListeners();
    Reflect.deleteProperty(navigator, 'geolocation');
  });

  it('shows the app header with its title and subtitle', async () => {
    await renderDesktop();

    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('heading', { level: 1, name: 'Mad Transit' })).toBeInTheDocument();
    expect(header.getByText('Paradas y llegadas de la EMT en tiempo real')).toBeInTheDocument();
  });

  it('asks the nearby stops again from the refresh button of the header', async () => {
    const user = userEvent.setup();
    const requests: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).searchParams.has('near')) requests.push(request.url);
    });
    await renderDesktop();
    // The fixture's date is old, so the header offers «Reintentar»; a fresh one, «Actualizar».
    const refresh = await within(screen.getByRole('banner')).findByRole('button', {
      name: /^(Actualizar|Reintentar)$/,
    });
    const before = requests.length;

    await user.click(refresh);

    await waitFor(() => expect(requests.length).toBeGreaterThan(before));
  });
});
