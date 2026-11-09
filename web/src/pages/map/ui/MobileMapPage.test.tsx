import { onlineManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/api/mocks/node';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { env, FAVORITES_STORAGE_KEY } from '@/shared/config';
import type * as SharedUi from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';

type CapturedMapProps = { onSelectPoint?: (id: string) => void };

const mapRenders = vi.hoisted(() => [] as CapturedMapProps[]);

// jsdom has no WebGL: the map is its container, with one button standing for MapLibre's
// focusable canvas, and records the props it receives.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: (props: CapturedMapProps) => {
    mapRenders.push(props);
    return (
      <section aria-label="Mapa">
        <button type="button">Lienzo del mapa</button>
      </section>
    );
  },
}));

function lastMapProps(): CapturedMapProps {
  const props = mapRenders.at(-1);
  if (!props) throw new Error('BaseMap was not rendered');
  return props;
}

const USER = { lat: 40.4169, lng: -3.7033 };
const POSITION_UNAVAILABLE = 2;
// The fixtures' data is 5 min old here, still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');

// The first request fails as if the position were unavailable, so the notice offers «Activar»;
// the next ones find the user.
function stubLocationAfterRetry() {
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((onSuccess) =>
    onSuccess({ coords: { latitude: USER.lat, longitude: USER.lng } } as GeolocationPosition),
  );
  getCurrentPosition.mockImplementationOnce((_, onError) =>
    onError?.({ code: POSITION_UNAVAILABLE } as GeolocationPositionError),
  );
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
}

// Tabs from the start of the page through every stop, until the focus leaves the page.
async function tabStops(): Promise<Element[]> {
  const stops: Element[] = [];
  for (;;) {
    await userEvent.tab();
    const focused = document.activeElement;
    if (!focused || focused === document.body || stops.includes(focused)) return stops;
    stops.push(focused);
  }
}

function renderPage(initialEntry = '/') {
  return renderWithRouter(undefined, { initialEntries: [initialEntry] });
}

function sheetHandle() {
  return screen.getByRole('button', { name: /^Ocultar (lista|detalle)$/ });
}

async function nearbyRows() {
  const nearby = await screen.findByRole('region', { name: 'Cercanas' });
  return within(nearby).findAllByRole('button', { name: /^Estación/ });
}

describe('MobileMapPage', () => {
  beforeEach(() => {
    mapRenders.length = 0;
    stubLocationAfterRetry();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'geolocation');
  });

  it('tabs through search, mode, recenter, handle, notice, favorites, list and map in order', async () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['1b']));
    await renderPage();
    const [firstNearbyRow] = await nearbyRows();
    const expectedOrder = [
      screen.getByRole('searchbox', { name: 'Buscar estación' }),
      screen.getByRole('button', { name: 'Sacar bici' }),
      screen.getByRole('button', { name: 'Centrar en mi posición' }),
      screen.getByRole('button', { name: 'Ocultar lista' }),
      screen.getByRole('button', { name: 'Activar' }),
      screen.getByRole('button', { name: 'Favoritas · 1' }),
      firstNearbyRow,
      screen.getByRole('button', { name: 'Lienzo del mapa' }),
    ];

    const stops = await tabStops();

    const positions = expectedOrder.map((element) => stops.indexOf(element as Element));
    expect(positions).not.toContain(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  // MapLibre's compact attribution sits top-right, 10 px down and about 24 px tall.
  it('floats a 44 px search and the mode 44 px from the top, clear of the map attribution', async () => {
    await renderPage();
    const search = screen.getByRole('searchbox', { name: 'Buscar estación' });
    const controls = search.closest('.absolute');

    expect(search).toHaveClass('h-11');
    expect(controls).toHaveClass('top-11');
    expect(controls).toContainElement(screen.getByRole('button', { name: 'Sacar bici' }));
  });

  it.each([
    { snap: 'half', clicks: 0 },
    { snap: 'hidden', clicks: 1 },
  ])('has no axe violations with the list at $snap', async ({ clicks }) => {
    const user = userEvent.setup();
    const { container } = await renderPage();
    await nearbyRows();

    for (let click = 0; click < clicks; click += 1) await user.click(sheetHandle());

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it('has no axe violations with a station open, at half and hidden', async () => {
    const user = userEvent.setup();
    const { container } = await renderPage();
    await nearbyRows();

    await act(async () => lastMapProps().onSelectPoint?.('1b'));
    await screen.findByRole('heading', { level: 2, name: 'Puerta del Sol B' });
    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();

    await user.click(sheetHandle());
    expect(
      screen.getByRole('button', { name: 'Mostrar detalle · Puerta del Sol B' }),
    ).toBeInTheDocument();
    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
  describe('without data', () => {
    afterEach(() => onlineManager.setOnline(true));

    it('says it needs the connection, with the search off and the map covered (SC2)', async () => {
      onlineManager.setOnline(false);
      const { container } = await renderPage();

      const [alert, ...otherAlerts] = await screen.findAllByRole('alert');
      expect(otherAlerts).toEqual([]);
      expect(alert).toHaveTextContent('Sin conexión a internet');
      expect(screen.getByRole('searchbox', { name: 'Buscar estación' })).toBeDisabled();
      expect(screen.getByRole('searchbox', { name: 'Buscar estación' })).toHaveAttribute(
        'placeholder',
        'Disponible al volver a conectarte',
      );
      expect(
        screen.getByText('El mapa no se puede cargar sin conexión').closest('output'),
      ).toHaveRole('status');
      expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });

    it('says the service fails, with the search off and a notice over the map (SC1)', async () => {
      server.use(
        http.get(`${env.apiBaseUrl}/v1/bicimad/stations`, () =>
          HttpResponse.json({ title: 'Service Unavailable', status: 503 }, { status: 503 }),
        ),
      );
      const { container } = await renderPage();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No podemos cargar las estaciones',
      );
      expect(screen.getByRole('searchbox', { name: 'Buscar estación' })).toHaveAttribute(
        'placeholder',
        'No disponible hasta recuperar los datos',
      );
      expect(
        screen.getByText('Las estaciones aparecerán aquí cuando se recupere el servicio'),
      ).toBeInTheDocument();
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
  describe('offline with data', () => {
    afterEach(() => onlineManager.setOnline(true));

    async function goOffline() {
      const view = await renderPage();
      await nearbyRows();
      act(() => onlineManager.setOnline(false));
      return view;
    }

    it('says so once, under the mode, and heads the sheet with the saved list (SC4)', async () => {
      const { container } = await goOffline();

      // findByRole fails on more than one alert.
      const banner = await screen.findByRole('alert');
      expect(banner).toHaveTextContent(
        'Sin conexión a internet. Se actualizará solo al volver a conectarte.',
      );
      const controls = screen
        .getByRole('searchbox', { name: 'Buscar estación' })
        .closest('.absolute');
      expect(controls).toContainElement(banner);
      expect(
        screen.getByRole('heading', { level: 2, name: 'Últimos datos guardados' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/· pueden no estar al día$/)).toBeInTheDocument();
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });

    it('names the hidden strip after the saved list', async () => {
      await goOffline();
      await screen.findByRole('alert');

      await userEvent.click(sheetHandle());

      expect(
        screen.getByRole('button', { name: 'Mostrar lista · Últimos datos guardados' }),
      ).toBeInTheDocument();
    });

    it('drops the banner and the saved heading when the connection returns', async () => {
      await goOffline();
      await screen.findByRole('alert');

      act(() => onlineManager.setOnline(true));

      await screen.findByRole('heading', { level: 2, name: /estaciones con bicis$/ });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
