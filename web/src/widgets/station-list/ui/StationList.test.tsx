import { onlineManager } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import type { StationsResponse } from '@jorgetroya80/mad-transit-client';
import type { Coordinates } from '@/entities/station';
import {
  nearbyStationsFixture,
  staleStationsFixture,
  stationsFixture,
} from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import {
  env,
  FAVORITES_OPEN_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  NEARBY_STORAGE_KEYS,
  POLL_INTERVAL_MS,
  RETRY_DELAYS_MS,
} from '@/shared/config';
import { formatClock } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { findStaleNotice } from '../../../../test/staleNotice';
import { StationList } from './StationList';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
const SOL: Coordinates = { lat: 40.41702, lng: -3.70243 };
// Five minutes after the fixtures' `updatedAt` (10:15), 35 after the stale one (09:45).
const NOW = new Date('2026-10-13T10:20:00Z');
// The app's QueryClient retries once after react-query's 1 s backoff, which runs on the
// fake clock that `shouldAdvanceTime` moves along with real time.
const AFTER_RETRY = { timeout: 3_000 };
const UNAVAILABLE = 503;
const SAVED_TITLE = 'Últimos datos guardados';
const SAVED_CAPTION = `De las ${formatClock(new Date(nearbyStationsFixture.updatedAt))} · pueden no estar al día`;
const SERVICE_ERROR_TITLE = 'No podemos cargar las estaciones';
const SERVICE_ERROR_BODY =
  'El servicio de BiciMAD no está respondiendo. Suele ser temporal; no es un problema de tu conexión.';

function respondNearby(resolver: () => Response) {
  server.use(
    http.get(STATIONS_URL, ({ request }) =>
      new URL(request.url).searchParams.has('near')
        ? resolver()
        : HttpResponse.json(stationsFixture),
    ),
  );
}

function nearbyJson(body: StationsResponse) {
  respondNearby(() => HttpResponse.json(body));
}

function failNearby() {
  respondNearby(() =>
    HttpResponse.json(
      { title: 'Service Unavailable', status: UNAVAILABLE },
      { status: UNAVAILABLE },
    ),
  );
}

function recordNearbyRequests(): URL[] {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.has('near')) urls.push(url);
  });
  return urls;
}

function recordAllRequests(): URL[] {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => urls.push(new URL(request.url)));
  return urls;
}

// The first stroke of a library icon, drawn apart, tells which icon a notice shows.
function iconPath(name: IconName) {
  const { container, unmount } = render(<Icon name={name} />);
  const path = container.querySelector('path')?.getAttribute('d');
  unmount();
  return path;
}

function firstIconPath(element: Element | null | undefined) {
  return element?.querySelector('svg path')?.getAttribute('d');
}

function saveFavorites(numbers: string[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(numbers));
}

type ListProps = {
  center: Coordinates | undefined;
  isApproximateLocation: boolean;
  isLocationDenied?: boolean;
};

const LOCATED: ListProps = { center: SOL, isApproximateLocation: false };

function renderList(props: Partial<ListProps> = {}, initialEntries?: string[]) {
  return renderWithRouter(<StationList {...LOCATED} {...props} />, { initialEntries });
}

async function nearbyRegion(name = 'Cerca de ti') {
  return screen.findByRole('region', { name });
}

function rowNames(region: HTMLElement): string[] {
  return within(region)
    .getAllByRole('button', { name: /^Estación/ })
    .map((row) => row.getAttribute('aria-label') ?? '');
}

describe('StationList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    server.events.removeAllListeners();
    onlineManager.setOnline(true);
  });

  it.each([
    { entry: '/', caption: 'Bicis disponibles' },
    { entry: '/?need=docks', caption: 'Anclajes libres' },
  ])('says under each heading what the numbers count ($entry)', async ({ entry, caption }) => {
    saveFavorites(['1b']);
    await renderList({}, [entry]);

    const nearby = await nearbyRegion();
    const favorites = await screen.findByRole('region', { name: 'Favoritas' });

    expect(nearby).toHaveAccessibleDescription(caption);
    expect(within(nearby).getByText(caption)).toBeVisible();
    expect(favorites).toHaveAccessibleDescription(caption);
  });

  it('lists the nearby stations in API order with number, name, distance and availability (SC1)', async () => {
    await renderList();

    const region = await nearbyRegion();
    await within(region).findAllByRole('button', { name: /^Estación/ });

    expect(rowNames(region)).toEqual([
      'Estación 1a, Puerta del Sol A, 12 metros, 1 minuto a pie, 12 bicis',
      'Estación 1b, Puerta del Sol B, 18 metros, 1 minuto a pie, 2 bicis',
      'Estación 2, Miguel Moya, 420 metros, 6 minutos a pie, Fuera de servicio',
    ]);
    expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent('Cerca de ti');
    expect(screen.queryByText(/Sin ubicación/)).not.toBeInTheDocument();
  });

  it('tags each row with its station number', async () => {
    await renderList();

    const region = await nearbyRegion();
    const [first] = await within(region).findAllByRole('button', { name: /^Estación/ });

    expect(first?.closest('li')).toHaveAttribute('data-station-number', '1a');
  });

  it('separates the rows by a 2 px gap, without dividers, as the design does', async () => {
    await renderList();

    const region = await nearbyRegion();
    const [first] = await within(region).findAllByRole('button', { name: /^Estación/ });
    const list = first?.closest('ul');

    expect(list).toHaveClass('flex', 'flex-col', 'gap-0.5');
    expect(list).not.toHaveClass('divide-y');
  });

  it('shows number, name, distance and walk as visible text, the name whole', async () => {
    await renderList();

    const row = await screen.findByRole('button', { name: /^Estación 1a,/ });

    expect(row).toHaveTextContent('1a');
    expect(within(row).getByText('Puerta del Sol A')).not.toHaveClass('truncate');
    expect(within(row).getByText('Puerta del Sol A').className).not.toMatch(/line-clamp/);
    expect(within(row).getByText('12 m · 1 min a pie')).toBeInTheDocument();
  });

  it('omits the distance of a station without one', async () => {
    saveFavorites(['3']);

    await renderList();

    const favorites = await screen.findByRole('region', { name: 'Favoritas' });
    const row = await within(favorites).findByRole('button', { name: /^Estación 3,/ });
    expect(row).not.toHaveTextContent(' m');
    expect(row).not.toHaveTextContent('a pie');
  });

  it.each([
    { number: '1a', count: '12', status: 'Disponible', tone: 'success' },
    { number: '1b', count: '2', status: 'Pocas', tone: 'warning' },
    { number: '2', count: '–', status: 'Fuera de servicio', tone: 'neutral' },
  ])(
    'draws the count of $number in a $tone badge with its status under it, leaving the count to the row name',
    async ({ number, count, status, tone }) => {
      await renderList();

      const row = await screen.findByRole('button', { name: new RegExp(`^Estación ${number},`) });
      const badge = within(row).getByText(count).parentElement;

      expect(badge).toHaveAttribute('aria-hidden', 'true');
      expect(badge).toHaveClass(`bg-tone-${tone}`, 'h-8', 'min-w-11');
      expect(within(row).getByText(status)).toHaveClass(`text-tone-${tone}-label`);
      expect(screen.queryByText(`${count} bicis, ${status}`)).toBeNull();
    },
  );

  it('has no axe violations with a selected row', async () => {
    const { container } = await renderList({}, ['/?station=1a']);
    await screen.findByRole('button', { name: /^Estación 1a,/, current: true });

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it('tags each section and lets its heading take the focus, for the page to return it', async () => {
    saveFavorites(['1a']);

    await renderList();

    const favorites = await screen.findByRole('region', { name: 'Favoritas' });
    const nearby = await nearbyRegion();
    expect(favorites).toHaveAttribute('data-station-list', 'favorites');
    expect(nearby).toHaveAttribute('data-station-list', 'nearby');
    expect(within(nearby).getByRole('heading', { level: 2 })).toHaveAttribute('tabindex', '-1');
  });

  it('heads each section at 16 px bold, with its caption in the meta size', async () => {
    await renderList();

    const nearby = await nearbyRegion();

    expect(within(nearby).getByRole('heading', { level: 2 })).toHaveClass(
      'text-base',
      'font-bold',
      'text-fg',
    );
    expect(within(nearby).getByText('Bicis disponibles')).toHaveClass('text-meta', 'text-fg-muted');
  });

  it('draws the approximate location notice as an info banner with the info icon', async () => {
    await renderList({ isApproximateLocation: true });

    const banner = screen.getByText(
      'Sin ubicación: mostrando estaciones cerca de la Puerta del Sol',
    ).parentElement;

    expect(banner).toHaveClass('bg-tone-info-soft', 'border-tone-info-soft-line', 'rounded-card');
    expect(firstIconPath(banner)).toBe(iconPath('info'));
  });

  it('warns about the approximate location and names the fallback place', async () => {
    await renderList({ isApproximateLocation: true });

    expect(
      screen.getByText('Sin ubicación: mostrando estaciones cerca de la Puerta del Sol'),
    ).toBeInTheDocument();
    expect(await nearbyRegion('Cerca de la Puerta del Sol')).toBeInTheDocument();
  });

  it('says the location permission was not given when it was denied', async () => {
    await renderList({ isApproximateLocation: true, isLocationDenied: true });

    expect(
      screen.getByText(
        'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sin ubicación/)).not.toBeInTheDocument();
    expect(await nearbyRegion('Cerca de la Puerta del Sol')).toBeInTheDocument();
  });

  describe('on desktop', () => {
    const NO_LOCATION =
      'Mostrando estaciones cerca de la Puerta del Sol porque no tenemos tu ubicación.';

    function renderDesktopList(props: Partial<ListProps> = {}, onLocate = () => {}) {
      return renderWithRouter(
        <StationList {...LOCATED} {...props} layout="desktop" onLocate={onLocate} />,
      );
    }

    it('heads the saved list with its time instead of the update line when offline', async () => {
      await renderDesktopList();
      await screen.findByRole('button', { name: /^Estación 1a/ });

      act(() => onlineManager.setOnline(false));

      expect(await nearbyRegion(SAVED_TITLE)).toHaveAccessibleDescription(SAVED_CAPTION);
      expect(screen.queryByText(/^Actualizado/)).not.toBeInTheDocument();
    });

    it('says it is using the current location, under «Cerca de ti» sorted by distance', async () => {
      await renderDesktopList();

      expect(screen.getByText('Usando tu ubicación actual.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Usar mi ubicación' })).not.toBeInTheDocument();
      expect(await nearbyRegion('Cerca de ti')).toHaveAccessibleDescription(
        'Ordenadas por distancia',
      );
    });

    it('offers to use the location when it has none, and asks for it', async () => {
      const onLocate = vi.fn<() => void>();
      await renderDesktopList({ isApproximateLocation: true }, onLocate);

      expect(screen.getByText(NO_LOCATION)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }));

      expect(onLocate).toHaveBeenCalledOnce();
      expect(await nearbyRegion('Cerca de la Puerta del Sol')).toHaveAccessibleDescription(
        'Ordenadas por distancia',
      );
    });

    it('says it is locating while it asks for the position again', async () => {
      const onLocate = vi.fn<() => void>();
      await renderWithRouter(
        <StationList
          center={SOL}
          isApproximateLocation
          layout="desktop"
          onLocate={onLocate}
          isLocating
        />,
      );

      const button = screen.getByRole('button', { name: 'Localizando…' });
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByRole('button', { name: 'Usar mi ubicación' })).not.toBeInTheDocument();
      await userEvent.click(button);

      expect(onLocate).not.toHaveBeenCalled();
    });

    it('says the permission was not given, without offering to ask again', async () => {
      await renderDesktopList({ isApproximateLocation: true, isLocationDenied: true });

      expect(
        screen.getByText(
          'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(NO_LOCATION)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Usar mi ubicación' })).not.toBeInTheDocument();
      expect(await nearbyRegion('Cerca de la Puerta del Sol')).toBeInTheDocument();
    });

    it('draws the location notice as an info banner with the pin and a primary action', async () => {
      await renderDesktopList({ isApproximateLocation: true });

      const banner = screen.getByText(NO_LOCATION).parentElement;

      expect(banner).toHaveClass('bg-tone-info-soft', 'border-tone-info-soft-line');
      expect(firstIconPath(banner)).toBe(iconPath('pin'));
      expect(
        within(banner ?? document.body).getByRole('button', { name: 'Usar mi ubicación' }),
      ).toHaveClass('bg-primary', 'h-10');
    });

    it('says nothing about the location while it is still pending', async () => {
      await renderDesktopList({ center: undefined });

      expect(screen.queryByText('Usando tu ubicación actual.')).not.toBeInTheDocument();
      expect(screen.queryByText(NO_LOCATION)).not.toBeInTheDocument();
    });

    it('folds the favorites under «Favoritas · N» and remembers it (SC5)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      saveFavorites(['3', '1b']);
      const { unmount } = await renderDesktopList();
      const header = await screen.findByRole('button', { name: 'Favoritas · 2' });
      const favorites = screen.getByRole('region', { name: 'Favoritas · 2' });
      await within(favorites).findAllByRole('button', { name: /^Estación/ });

      expect(header).toHaveAttribute('aria-expanded', 'true');
      expect(favorites.closest('[data-station-list="favorites"]')).not.toBeNull();
      await user.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(within(favorites).queryByRole('button', { name: /^Estación/ })).toBeNull();
      expect(localStorage.getItem(FAVORITES_OPEN_STORAGE_KEY)).toBe('false');
      unmount();

      await renderDesktopList();

      expect(await screen.findByRole('button', { name: 'Favoritas · 2' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('heads the favorites with a filled star and a chevron that turns as they fold', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      saveFavorites(['1b']);
      await renderDesktopList();
      const header = await screen.findByRole('button', { name: 'Favoritas · 1' });
      const [star, chevron] = [...header.querySelectorAll('svg')];
      const panel = document.getElementById(header.getAttribute('aria-controls') ?? '');

      expect(star).toHaveAttribute('width', '18');
      expect(star).toHaveAttribute('fill', 'currentColor');
      expect(star).toHaveClass('text-primary');
      expect(chevron).toHaveClass('rotate-180');
      await user.click(header);

      expect(chevron).not.toHaveClass('rotate-180');
      expect(panel).toHaveAttribute('hidden');
      await user.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'true');
      expect(
        within(screen.getByRole('region', { name: 'Favoritas · 1' })).getAllByRole('button', {
          name: /^Estación/,
        }),
      ).toHaveLength(1);
    });

    it('lets the favorites heading, an h2, take the focus without a tab stop', async () => {
      saveFavorites(['1b']);
      await renderDesktopList();

      const heading = await screen.findByRole('heading', { level: 2, name: 'Favoritas · 1' });

      expect(heading).toHaveAttribute('tabindex', '-1');
    });

    it('keeps the favorites open when the stored state is not valid', async () => {
      localStorage.setItem(FAVORITES_OPEN_STORAGE_KEY, '"folded"');
      saveFavorites(['1b']);
      await renderDesktopList();

      expect(await screen.findByRole('button', { name: 'Favoritas · 1' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('has no favorites header without favorites', async () => {
      await renderDesktopList();
      await nearbyRegion();

      expect(screen.queryByRole('button', { name: /^Favoritas/ })).not.toBeInTheDocument();
    });

    it('has no axe violations with the favorites folded', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      saveFavorites(['1b']);
      const { container } = await renderDesktopList();
      await user.click(await screen.findByRole('button', { name: 'Favoritas · 1' }));

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with the location notice and its action', async () => {
      const { container } = await renderDesktopList({ isApproximateLocation: true });
      await nearbyRegion('Cerca de la Puerta del Sol');

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('on mobile', () => {
    const NO_LOCATION = 'Sin tu ubicación: cerca de la Puerta del Sol';

    function renderMobileList(props: Partial<ListProps> & { isLocating?: boolean } = {}) {
      const onLocate = vi.fn<() => void>();
      const view = renderWithRouter(
        <StationList {...LOCATED} {...props} layout="mobile" onLocate={onLocate} />,
      );
      return { view, onLocate };
    }

    it('leads the stale notice with the age of the data', async () => {
      nearbyJson({
        ...nearbyStationsFixture,
        updatedAt: staleStationsFixture.updatedAt,
        stale: true,
      });
      await renderMobileList().view;

      expect(await findStaleNotice()).toHaveTextContent(
        'Datos de hace 35 min. No hemos podido actualizar; puede que ya no sean exactos.',
      );
    });

    it('keeps «Cercanas» offline: the sheet header says the list is the saved one', async () => {
      await renderMobileList().view;
      await screen.findByRole('button', { name: /^Estación 1a/ });

      act(() => onlineManager.setOnline(false));

      expect(await nearbyRegion('Cercanas')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: SAVED_TITLE })).not.toBeInTheDocument();
    });

    it('says it is using the current location, without an action', async () => {
      await renderMobileList().view;

      expect(screen.getByText('Usando tu ubicación actual.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Activar' })).not.toBeInTheDocument();
      expect(screen.queryByText(NO_LOCATION)).not.toBeInTheDocument();
    });

    it('offers to turn the location on when it has none, and asks for it', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { view, onLocate } = renderMobileList({ isApproximateLocation: true });
      await view;

      expect(screen.getByText(NO_LOCATION)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Activar' }));

      expect(onLocate).toHaveBeenCalledOnce();
    });

    it('keeps «Activar» busy while it asks for the position', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { view, onLocate } = renderMobileList({
        isApproximateLocation: true,
        isLocating: true,
      });
      await view;

      const button = screen.getByRole('button', { name: 'Activar' });
      expect(button).toHaveAttribute('aria-busy', 'true');
      await user.click(button);

      expect(onLocate).not.toHaveBeenCalled();
    });

    it('says the permission was not given, without offering to ask again', async () => {
      await renderMobileList({ isApproximateLocation: true, isLocationDenied: true }).view;

      expect(
        screen.getByText(
          'No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(NO_LOCATION)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Activar' })).not.toBeInTheDocument();
    });

    it('says nothing about the location while it is still pending', async () => {
      await renderMobileList({ center: undefined }).view;

      expect(screen.queryByText('Usando tu ubicación actual.')).not.toBeInTheDocument();
      expect(screen.queryByText(NO_LOCATION)).not.toBeInTheDocument();
    });

    it('lists the nearby stations under «Cercanas», without caption or update time', async () => {
      await renderMobileList({ isApproximateLocation: true }).view;

      const region = await nearbyRegion('Cercanas');
      await within(region).findAllByRole('button', { name: /^Estación/ });

      expect(within(region).getByRole('heading', { level: 3 })).toHaveTextContent('Cercanas');
      expect(region).not.toHaveAccessibleDescription();
      expect(region).toHaveAttribute('data-station-list', 'nearby');
      expect(screen.queryByText('Ordenadas por distancia')).not.toBeInTheDocument();
      expect(screen.queryByText('Bicis disponibles')).not.toBeInTheDocument();
      expect(screen.queryByText(/Actualizado/)).not.toBeInTheDocument();
    });

    it('folds the favorites, above «Cercanas», under an h3', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      saveFavorites(['1b']);
      await renderMobileList().view;

      const header = await screen.findByRole('button', { name: 'Favoritas · 1' });
      const favorites = screen.getByRole('region', { name: 'Favoritas · 1' });
      const regions = screen.getAllByRole('region');

      expect(screen.getByRole('heading', { level: 3, name: 'Favoritas · 1' })).toContainElement(
        header,
      );
      expect(regions.indexOf(favorites)).toBeLessThan(
        regions.indexOf(await nearbyRegion('Cercanas')),
      );
      await user.click(header);
      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(localStorage.getItem(FAVORITES_OPEN_STORAGE_KEY)).toBe('false');
    });

    it('has no axe violations with the notice, its action and the favorites', async () => {
      saveFavorites(['1b']);
      const { view } = renderMobileList({ isApproximateLocation: true });
      const { container } = await view;
      await screen.findByRole('button', { name: 'Favoritas · 1' });
      await within(await nearbyRegion('Cercanas')).findAllByRole('button', { name: /^Estación/ });

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  it('shows loading without asking for nearby stations while the location is pending', async () => {
    const all = recordAllRequests();

    await renderList({ center: undefined });

    expect(screen.getByRole('status')).toHaveTextContent('Cargando estaciones cercanas');
    await waitFor(() => expect(all).toHaveLength(1));
    expect(all.some((url) => url.searchParams.has('near'))).toBe(false);
  });

  it('draws the loading message with the spinner in the body size, without the old stripe', async () => {
    await renderList({ center: undefined });

    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveClass('text-body', 'text-fg-muted');
    expect(status).not.toHaveClass('border-l-4');
    expect(status.querySelector('svg')).toHaveClass('animate-spin');
  });

  it('draws the empty message in the body size, without the old stripe', async () => {
    nearbyJson({ ...nearbyStationsFixture, stations: [] });
    await renderList();

    const status = await screen.findByText('Ninguna estación en 500 m');

    expect(status).toHaveRole('status');
    expect(status).toHaveClass('text-body', 'text-fg-muted');
    expect(status).not.toHaveClass('border-l-4');
  });

  it('says so when no station is within the radius', async () => {
    nearbyJson({ ...nearbyStationsFixture, stations: [] });

    await renderList();

    expect(await screen.findByText('Ninguna estación en 500 m')).toBeInTheDocument();
  });

  it('shows an error without data and retries on demand', async () => {
    const requests = recordNearbyRequests();
    failNearby();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderList();

    const alert = await screen.findByRole('alert', {}, AFTER_RETRY);
    expect(alert).toHaveTextContent(SERVICE_ERROR_TITLE);
    expect(alert).toHaveTextContent(SERVICE_ERROR_BODY);
    const attemptsBeforeRetry = requests.length;

    nearbyJson(nearbyStationsFixture);
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('button', { name: /^Estación 1a/ })).toBeInTheDocument();
    expect(requests.length).toBeGreaterThan(attemptsBeforeRetry);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('draws the service error with the cloud on a danger circle and a large retry', async () => {
    failNearby();
    await renderList();

    const alert = await screen.findByRole('alert', {}, AFTER_RETRY);
    const circle = alert.parentElement?.firstElementChild;
    const retry = screen.getByRole('button', { name: 'Reintentar' });

    expect(circle).toHaveClass('bg-tone-danger-soft', 'size-18');
    expect(firstIconPath(circle)).toBe(iconPath('cloud-alert'));
    expect(within(alert).getByRole('heading', { level: 2 })).toHaveClass('text-title-lg');
    expect(retry).toHaveClass('h-12', 'bg-primary');
    expect(firstIconPath(retry)).toBe(iconPath('refresh'));
  });

  it('keeps «Reintentar» busy until the request it sent answers', async () => {
    failNearby();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderList();
    const retry = await screen.findByRole('button', { name: 'Reintentar' }, AFTER_RETRY);
    server.use(http.get(STATIONS_URL, () => delay('infinite')));

    await user.click(retry);

    expect(retry).toHaveAttribute('aria-busy', 'true');
    expect(retry).toHaveFocus();
  });

  describe('countdown to the next automatic retry (SC1)', () => {
    const [FIRST_RETRY_MS, SECOND_RETRY_MS, LAST_RETRY_MS] = RETRY_DELAYS_MS;
    const SECOND_MS = 1000;

    function countdown(seconds: number) {
      return `Volveremos a intentarlo solos en ${seconds} s.`;
    }

    async function showsCountdown(seconds: number) {
      return screen.findByText(countdown(seconds), {}, AFTER_RETRY);
    }

    // The footer says one second is left until the request goes out, and not before.
    async function expectRetryWhenCountdownEnds(requests: URL[], waitMs: number) {
      const before = requests.length;
      await vi.advanceTimersByTimeAsync(waitMs - SECOND_MS);
      expect(screen.getByText(countdown(1))).toBeInTheDocument();
      expect(requests).toHaveLength(before);
      await vi.advanceTimersByTimeAsync(SECOND_MS);
      await waitFor(() => expect(requests).toHaveLength(before + 1));
    }

    it('counts down 30, 60 and then 120 s after one, two and three failures', async () => {
      const requests = recordNearbyRequests();
      failNearby();

      await renderList();

      for (const [waitMs, nextWaitMs] of [
        [FIRST_RETRY_MS, SECOND_RETRY_MS],
        [SECOND_RETRY_MS, LAST_RETRY_MS],
      ] as const) {
        expect(await showsCountdown(waitMs / SECOND_MS)).toBeInTheDocument();
        await expectRetryWhenCountdownEnds(requests, waitMs);
        expect(await showsCountdown(nextWaitMs / SECOND_MS)).toBeInTheDocument();
      }
    });

    it('says it is trying again while a request is in flight', async () => {
      failNearby();
      await renderList();
      await showsCountdown(FIRST_RETRY_MS / SECOND_MS);
      server.use(http.get(STATIONS_URL, () => delay('infinite')));

      await vi.advanceTimersByTimeAsync(FIRST_RETRY_MS);

      expect(await screen.findByText('Intentándolo de nuevo…')).toBeInTheDocument();
      expect(screen.queryByText(/Volveremos a intentarlo/)).not.toBeInTheDocument();
    });

    it('keeps the countdown out of the alert', async () => {
      failNearby();
      await renderList();

      const footer = await showsCountdown(FIRST_RETRY_MS / SECOND_MS);

      expect(screen.getByRole('alert')).not.toContainElement(footer);
      expect(footer).toHaveAttribute('aria-live', 'off');
    });

    it('asks at once on «Reintentar» and restarts the wait at 30 s', async () => {
      const requests = recordNearbyRequests();
      failNearby();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await renderList();
      await showsCountdown(FIRST_RETRY_MS / SECOND_MS);
      await expectRetryWhenCountdownEnds(requests, FIRST_RETRY_MS);
      await showsCountdown(SECOND_RETRY_MS / SECOND_MS);
      const before = requests.length;

      await user.click(screen.getByRole('button', { name: 'Reintentar' }));

      await waitFor(() => expect(requests).toHaveLength(before + 1));
      expect(await showsCountdown(FIRST_RETRY_MS / SECOND_MS)).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
      failNearby();
      const { container } = await renderList();
      await showsCountdown(FIRST_RETRY_MS / SECOND_MS);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  it('keeps the rows when a later refresh fails', async () => {
    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });

    failNearby();
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(await findStaleNotice(AFTER_RETRY)).toBeInTheDocument();
    expect(screen.queryByText('No se pudo actualizar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Estación 1a/ })).toBeInTheDocument();
    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();
  });

  it('warns when the EMT data is stale', async () => {
    nearbyJson({
      ...nearbyStationsFixture,
      updatedAt: staleStationsFixture.updatedAt,
      stale: true,
    });

    await renderList();

    expect(await findStaleNotice()).toHaveTextContent(
      `Mostramos los datos de las ${formatClock(new Date(staleStationsFixture.updatedAt))}`,
    );
  });

  it('dates stale data with an invalid updatedAt by the full list, the older one', async () => {
    nearbyJson({ ...nearbyStationsFixture, updatedAt: 'nope', stale: true });

    await renderList();

    expect(await findStaleNotice()).toHaveTextContent(
      `Mostramos los datos de las ${formatClock(new Date(stationsFixture.updatedAt))}`,
    );
  });

  it('warns when only the full list is stale, by the time of its data (SC3)', async () => {
    server.use(
      http.get(STATIONS_URL, ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.has('near')
            ? nearbyStationsFixture
            : staleStationsFixture,
        ),
      ),
    );

    await renderList();

    expect(await findStaleNotice()).toHaveTextContent(
      `Mostramos los datos de las ${formatClock(new Date(staleStationsFixture.updatedAt))}`,
    );
  });

  it('asks for both lists again from the stale notice, busy until they answer', async () => {
    nearbyJson({ ...nearbyStationsFixture, stale: true });
    await renderList();
    const notice = await findStaleNotice();
    const requests = recordAllRequests();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await user.click(within(notice).getByRole('button', { name: 'Reintentar' }));

    await waitFor(() =>
      expect(requests.map((url) => url.searchParams.has('near')).sort()).toEqual([false, true]),
    );
    await waitFor(() =>
      expect(within(notice).getByRole('button', { name: 'Reintentar' })).not.toHaveAttribute(
        'aria-busy',
      ),
    );
  });

  it('leaves stale data to the offline notice once the connection drops', async () => {
    nearbyJson({ ...nearbyStationsFixture, stale: true });
    await renderList();
    await findStaleNotice();

    act(() => onlineManager.setOnline(false));

    await nearbyRegion(SAVED_TITLE);
    expect(screen.queryByText(/No hemos podido actualizar/)).not.toBeInTheDocument();
  });

  it('greys out the counts of unconfirmed data', async () => {
    nearbyJson({ ...nearbyStationsFixture, stale: true });

    await renderList();

    expect(
      await screen.findByRole('button', {
        name: 'Estación 1a, Puerta del Sol A, 12 metros, 1 minuto a pie, 12 bicis, sin confirmar',
      }),
    ).toBeInTheDocument();
  });

  it('greys out the favorites when the full list is not confirmed', async () => {
    saveFavorites(['1b']);
    server.use(
      http.get(STATIONS_URL, () => HttpResponse.json({ ...stationsFixture, stale: true })),
    );

    await renderList();

    const favorites = await screen.findByRole('region', { name: 'Favoritas' });
    expect(
      await within(favorites).findByRole('button', { name: /2 bicis, sin confirmar$/ }),
    ).toBeInTheDocument();
  });

  it('does not warn about fresh data', async () => {
    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });

    expect(screen.queryByText(/Sin confirmar/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No hemos podido actualizar/)).not.toBeInTheDocument();
  });

  it('marks the list unconfirmed once the data is over 5 min old', async () => {
    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });

    // The fixtures are 5 min old at NOW: the next clock tick passes the limit.
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(await findStaleNotice()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Estación 1a/ })).toBeInTheDocument();
  });

  it('keeps the rows as the last saved data when the connection drops (SC4)', async () => {
    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    const saved = await nearbyRegion(SAVED_TITLE);
    expect(saved).toHaveAccessibleDescription(SAVED_CAPTION);
    expect(within(saved).getByRole('button', { name: /^Estación 1a/ })).toBeInTheDocument();
    // The page says the connection is gone, once, in its own bar or banner.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks again and goes back to the nearby heading when the connection returns', async () => {
    const requests = recordNearbyRequests();
    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await nearbyRegion(SAVED_TITLE);
    // The poll that falls due while offline waits for the connection.
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    const requestsWhileOffline = requests.length;

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(requests.length).toBeGreaterThan(requestsWhileOffline));
    const nearby = await nearbyRegion();
    expect(screen.queryByRole('region', { name: SAVED_TITLE })).not.toBeInTheDocument();
    expect(within(nearby).getByRole('button', { name: /^Estación 1a/ })).toBeInTheDocument();
  });

  it('says it needs the connection when offline without data, with no retry or countdown (SC2)', async () => {
    onlineManager.setOnline(false);

    const { container } = await renderList();

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Sin conexión a internet',
    );
    expect(alert).toHaveTextContent(
      'Necesitas conexión para ver las estaciones la primera vez. Se cargarán solas al volver a conectarte.',
    );
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Volveremos a intentarlo/)).not.toBeInTheDocument();
    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it('draws the offline block with the crossed wifi on a neutral circle', async () => {
    onlineManager.setOnline(false);
    await renderList();

    const alert = await screen.findByRole('alert');
    const circle = alert.parentElement?.firstElementChild;

    expect(circle).toHaveClass('bg-chip', 'size-18');
    expect(firstIconPath(circle)).toBe(iconPath('wifi-off'));
  });

  it('loads the stations by itself when the connection returns', async () => {
    onlineManager.setOnline(false);
    await renderList();
    await screen.findByText('Sin conexión a internet');

    act(() => onlineManager.setOnline(true));

    expect(await screen.findByRole('button', { name: /^Estación 1a/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the saved nearby list while the location is pending', async () => {
    localStorage.setItem(
      NEARBY_STORAGE_KEYS.bikes,
      JSON.stringify({ near: '40.4170,-3.7024', response: nearbyStationsFixture, savedAt: 0 }),
    );

    await renderList({ center: undefined });

    const region = await nearbyRegion();
    expect(await within(region).findAllByRole('button', { name: /^Estación/ })).toHaveLength(3);
    expect(screen.queryByText('Cargando estaciones cercanas…')).not.toBeInTheDocument();
  });

  // TanStack drops placeholder data once the request fails: the saved list must survive it.
  it.each([
    ['the API fails', () => failNearby()],
    ['the network fails', () => respondNearby(() => HttpResponse.error())],
  ])('keeps the saved nearby list, unconfirmed, when %s', async (_case, fail) => {
    localStorage.setItem(
      NEARBY_STORAGE_KEYS.bikes,
      JSON.stringify({ near: '40.4170,-3.7024', response: nearbyStationsFixture, savedAt: 0 }),
    );
    fail();

    await renderList();

    expect(await findStaleNotice(AFTER_RETRY)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Estación 1a/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows how long ago the nearby list was updated', async () => {
    await renderList();

    const region = await nearbyRegion();

    expect(await within(region).findByText(/Actualizado/)).toHaveTextContent(
      'Actualizado hace 5 minutos',
    );
  });

  it('dates the list by its arrival when updatedAt is invalid', async () => {
    nearbyJson({ ...nearbyStationsFixture, updatedAt: 'nope' });

    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });

    expect(screen.getByText(/Actualizado/)).toHaveTextContent('Actualizado ahora');
  });

  it('shows favorites on top in insertion order, skipping unknown numbers (SC8)', async () => {
    saveFavorites(['3', '99', '1b']);

    await renderList();

    const favorites = await screen.findByRole('region', { name: 'Favoritas' });
    await within(favorites).findAllByRole('button', { name: /^Estación/ });

    expect(rowNames(favorites)).toEqual([
      'Estación 3, Plaza Conde Suchil, 0 bicis',
      'Estación 1b, Puerta del Sol B, 2 bicis',
    ]);
    const regions = screen.getAllByRole('region');
    expect(regions.indexOf(favorites)).toBeLessThan(regions.indexOf(await nearbyRegion()));
  });

  it('has no favorites section without favorites', async () => {
    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });

    expect(screen.queryByRole('region', { name: 'Favoritas' })).not.toBeInTheDocument();
  });

  it('has no favorites section when none of them exists', async () => {
    saveFavorites(['99']);

    await renderList();
    await screen.findByRole('button', { name: /^Estación 1a/ });

    expect(screen.queryByRole('region', { name: 'Favoritas' })).not.toBeInTheDocument();
  });

  it('selects the station of a clicked row', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { router } = await renderList();

    await user.click(await screen.findByRole('button', { name: /^Estación 1b/ }));

    expect(router.state.location.href).toBe('/?station=1b');
  });

  it('marks the rows of the selected station in every section, whatever the case of ?station', async () => {
    saveFavorites(['1a', '3']);

    await renderList({}, ['/?station=1A']);

    const favorites = await screen.findByRole('region', { name: 'Favoritas' });
    const favoriteRow = await within(favorites).findByRole('button', { name: /^Estación 1a,/ });
    const nearbyRow = await within(await nearbyRegion()).findByRole('button', {
      name: /^Estación 1a,/,
    });
    expect(favoriteRow).toHaveAttribute('aria-current', 'true');
    expect(nearbyRow).toHaveAttribute('aria-current', 'true');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(2);
  });

  it('asks for and shows free docks with need=docks', async () => {
    const requests = recordNearbyRequests();

    await renderList({}, ['/?need=docks']);

    const region = await nearbyRegion();
    await within(region).findAllByRole('button', { name: /^Estación/ });

    expect(requests.map((url) => url.searchParams.get('need'))).toEqual(['docks']);
    expect(rowNames(region)).toEqual([
      'Estación 1a, Puerta del Sol A, 12 metros, 1 minuto a pie, 12 anclajes libres',
      'Estación 1b, Puerta del Sol B, 18 metros, 1 minuto a pie, 22 anclajes libres',
      'Estación 2, Miguel Moya, 420 metros, 6 minutos a pie, Fuera de servicio',
    ]);
  });
});
