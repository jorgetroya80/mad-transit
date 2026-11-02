import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as SharedUi from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { stubMatchMedia } from '../../../../test/matchMedia';
import { renderWithRouter } from '../../../../test/renderWithRouter';

type CapturedMapProps = {
  label?: string;
  className?: string;
  onSelectPoint?: (id: string) => void;
  focusPadding?: { bottom: number; right?: number };
};

const mapRenders = vi.hoisted(() => [] as CapturedMapProps[]);

// jsdom has no WebGL: the map is only its named container and records the props it receives.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUi>()),
  BaseMap: (props: CapturedMapProps) => {
    mapRenders.push(props);
    return <section aria-label={props.label} className={props.className} />;
  },
}));

function lastMapProps(): CapturedMapProps {
  const props = mapRenders.at(-1);
  if (!props) throw new Error('BaseMap was not rendered');
  return props;
}

async function nearbyRow(number: string) {
  const nearby = await within(panel()).findByRole('region', { name: 'Cerca de ti' });
  return within(nearby).findByRole('button', { name: new RegExp(`^Estación ${number},`) });
}

function currentRows() {
  return Array.from(document.querySelectorAll<HTMLElement>('[aria-current="true"]'));
}

const USER = { lat: 40.4169, lng: -3.7033 };
// The fixtures' data is 5 min old here, still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');

function stubGrantedLocation() {
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((onSuccess) =>
    onSuccess({ coords: { latitude: USER.lat, longitude: USER.lng } } as GeolocationPosition),
  );
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
}

function renderPage(initialEntry = '/') {
  return renderWithRouter(undefined, { initialEntries: [initialEntry] });
}

function panel() {
  return screen.getByRole('region', { name: 'Estaciones' });
}

describe('DesktopMapPage', () => {
  let media: ReturnType<typeof stubMatchMedia>;

  beforeEach(() => {
    mapRenders.length = 0;
    media = stubMatchMedia(true);
    stubGrantedLocation();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'geolocation');
  });

  it('shows the brand and the data freshness in a header above the panel and the map', async () => {
    await renderPage();

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1, name: 'Mad Transit' })).toBeVisible();
    expect(await within(header).findByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(screen.getByRole('main')).getByRole('region', { name: 'Estaciones' })).toBe(
      panel(),
    );
  });

  it('puts search, mode cards, list and attribution in a 420 px panel', async () => {
    await renderPage();

    const region = panel();
    expect(region).toHaveClass('w-105');
    expect(within(region).getByRole('searchbox')).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Dejar bici' })).toHaveAccessibleDescription(
      'Anclajes libres',
    );
    expect(await within(region).findByRole('region', { name: 'Cerca de ti' })).toBeInTheDocument();
    expect(within(region).getByRole('link', { name: 'EMT de Madrid' })).toBeInTheDocument();
    expect(within(region).queryByRole('button', { name: 'Mi ubicación' })).not.toBeInTheDocument();
  });

  it('keeps the list in the panel with a station selected, without its detail', async () => {
    await renderPage('/?station=1a');

    const nearby = await within(panel()).findByRole('region', { name: 'Cerca de ti' });
    expect(
      await within(nearby).findByRole('button', { name: /^Estación 1a,/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: '1a · Puerta del Sol A' }),
    ).not.toBeInTheDocument();
  });

  it('marks the row chosen in the list', async () => {
    await renderPage();

    await userEvent.click(await nearbyRow('1b'));

    expect(await nearbyRow('1b')).toHaveAttribute('aria-current', 'true');
    expect(currentRows()).toEqual([await nearbyRow('1b')]);
  });

  it('marks the same row when the station is chosen on the map', async () => {
    await renderPage();
    await nearbyRow('1b');

    await act(async () => lastMapProps().onSelectPoint?.('1b'));

    expect(currentRows()).toEqual([await nearbyRow('1b')]);
  });

  it('centers the map clear of the station card on its right', async () => {
    await renderPage('/?station=1a');
    await nearbyRow('1a');

    expect(lastMapProps().focusPadding).toEqual({ bottom: 0, right: 352 });
  });

  it('names the map after the stations', async () => {
    await renderPage();

    expect(
      within(screen.getByRole('main')).getByRole('region', { name: 'Mapa de estaciones' }),
    ).toBeInTheDocument();
  });

  it('switches to the bottom sheet below md', async () => {
    await renderPage();

    act(() => media.change(false));

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Estaciones' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = await renderPage('/?station=1a');
    await within(panel()).findByRole('region', { name: 'Cerca de ti' });

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
