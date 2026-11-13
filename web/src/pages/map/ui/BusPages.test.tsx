import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as SharedUi from '@/shared/ui';
import { stubMatchMedia } from '../../../../test/matchMedia';
import { renderWithRouter } from '../../../../test/renderWithRouter';

// jsdom has no WebGL: the map is a plain element here.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: () => <div data-testid="base-map" />,
}));

const USER = { lat: 40.4169, lng: -3.7033 };
const PERMISSION_DENIED = 1;
const STOP_LABEL = /^Parada 72, Puerta del Sol/;

// The location answers at once; `denied` makes the browser refuse it.
function stubGeolocation({ denied = false } = {}) {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: (onSuccess: PositionCallback, onError?: PositionErrorCallback) => {
        if (denied)
          onError?.({ code: PERMISSION_DENIED, PERMISSION_DENIED } as GeolocationPositionError);
        else
          onSuccess({ coords: { latitude: USER.lat, longitude: USER.lng } } as GeolocationPosition);
      },
    },
    configurable: true,
  });
}

function renderBus(initialEntry: string) {
  return renderWithRouter(undefined, { initialEntries: [initialEntry] });
}

function sheetHandle(name: string) {
  return screen.getByRole('button', { name });
}

describe('bus pages', () => {
  beforeEach(() => stubGeolocation());

  describe('from md', () => {
    beforeEach(() => stubMatchMedia(true));

    it('lists the nearby stops in the Paradas panel, next to their map', async () => {
      await renderBus('/?service=bus');

      expect(screen.getByRole('region', { name: 'Paradas' })).toBeInTheDocument();
      expect(screen.getByTestId('base-map')).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: STOP_LABEL })).toBeInTheDocument();
    });

    it('lists the stops from Sol, with their distances, when the permission is denied', async () => {
      stubGeolocation({ denied: true });

      await renderBus('/?service=bus');

      expect(
        await screen.findByText(
          'No has dado permiso de ubicación: mostrando paradas cerca de la Puerta del Sol',
        ),
      ).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: STOP_LABEL })).toHaveAccessibleName(
        expect.stringContaining('12 metros'),
      );
    });

    it('writes ?stop when a stop is tapped', async () => {
      const user = userEvent.setup();
      const { router } = await renderBus('/?service=bus');

      await user.click(await screen.findByRole('button', { name: STOP_LABEL }));

      expect(router.state.location.href).toBe('/?service=bus&stop=72');
    });
  });

  describe('below md', () => {
    beforeEach(() => stubMatchMedia(false));

    it('opens the sheet when ?stop arrives while it is hidden', async () => {
      const user = userEvent.setup();
      const { router } = await renderBus('/?service=bus');
      await user.click(sheetHandle('Ocultar lista'));
      expect(sheetHandle('Mostrar paradas cercanas')).toHaveAttribute('aria-expanded', 'false');

      await act(async () => router.history.push('/?service=bus&stop=72'));

      expect(await screen.findByRole('button', { name: 'Ocultar lista' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });
  });
});
