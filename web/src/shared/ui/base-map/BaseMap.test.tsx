import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MADRID_CENTER,
  MADRID_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE_URL,
  MD_MEDIA_QUERY,
  REDUCED_MOTION_QUERY,
} from '@/shared/config';
import { expectNoAxeViolations } from '../../../../test/axe';
import { firstIconPath, iconPath } from '../../../../test/iconPath';
import { BaseMap, type MapPopup } from './BaseMap';
import {
  POINT_LAYER_ID,
  POINTS_SOURCE_ID,
  toFeatureCollection,
  toUserLocationCollection,
  USER_LOCATION_HALO_LAYER_ID,
  USER_LOCATION_LAYER_ID,
  USER_LOCATION_SOURCE_ID,
  type MapPoint,
} from './points';

const maplibre = vi.hoisted(() => {
  const instances: MockMap[] = [];
  const popups: MockPopup[] = [];

  class MockAttributionControl {
    constructor(readonly options: unknown) {}
  }

  class MockPopup {
    lngLat: unknown;
    element: HTMLElement | undefined;
    readonly remove = vi.fn<() => void>(() => this.element?.remove());

    constructor(readonly options: Record<string, unknown>) {
      popups.push(this);
    }

    setLngLat(lngLat: unknown) {
      this.lngLat = lngLat;
      return this;
    }

    setDOMContent(element: HTMLElement) {
      this.element = element;
      return this;
    }

    // MapLibre puts the content in the map's container; the mock puts it in the document.
    addTo() {
      if (this.element) document.body.append(this.element);
      return this;
    }
  }

  class MockSource {
    readonly setData = vi.fn<(data: unknown) => void>();
  }

  type Handler = (event: Record<string, unknown>) => void;
  type Subscription = { type: string; layerId: string | undefined; handler: Handler };

  class MockMap {
    readonly addControl = vi.fn<(control: unknown, position?: string) => void>();
    readonly removeControl = vi.fn<(control: unknown) => void>();
    readonly remove = vi.fn<() => void>();
    readonly off = vi.fn<(type: string, handler: Handler) => void>();
    readonly addLayer = vi.fn<(layer: { id: string; source?: unknown }) => void>();
    readonly easeTo = vi.fn<(options: unknown) => void>();
    readonly fitBounds = vi.fn<(bounds: unknown, options: unknown) => void>();
    readonly zoomIn = vi.fn<() => void>();
    readonly zoomOut = vi.fn<() => void>();
    readonly setMissingStyleImageResolver =
      vi.fn<(resolver: ((id: string) => Promise<void>) | null) => void>();
    readonly hasImage = vi.fn<(id: string) => boolean>(() => false);
    readonly addImage = vi.fn<(id: string, image: unknown, options: unknown) => void>();
    readonly sources = new Map<string, MockSource>();
    readonly subscriptions: Subscription[] = [];
    readonly canvas = { style: { cursor: '' } };

    readonly addSource = vi.fn<(id: string, source: unknown) => void>((id) => {
      this.sources.set(id, new MockSource());
    });

    getSource(id: string) {
      return this.sources.get(id);
    }

    getCanvas() {
      return this.canvas;
    }

    on(type: string, layerOrHandler: string | Handler, handler?: Handler) {
      if (typeof layerOrHandler === 'string' && handler) {
        this.subscriptions.push({ type, layerId: layerOrHandler, handler });
      } else if (typeof layerOrHandler === 'function') {
        this.subscriptions.push({ type, layerId: undefined, handler: layerOrHandler });
      }
      return this;
    }

    fire(type: string, layerId?: string, event: Record<string, unknown> = {}) {
      this.subscriptions
        .filter((subscription) => subscription.type === type && subscription.layerId === layerId)
        .forEach((subscription) => subscription.handler(event));
    }

    constructor(readonly options: Record<string, unknown>) {
      instances.push(this);
    }
  }

  // Plain array: setWorkerUrl runs at import time, before Vitest's clearMocks wipes vi.fn calls.
  const workerUrls: string[] = [];
  const setWorkerUrl = (url: string) => workerUrls.push(url);

  return {
    instances,
    popups,
    MockMap,
    MockAttributionControl,
    MockPopup,
    workerUrls,
    setWorkerUrl,
  };
});

vi.mock('maplibre-gl', () => ({
  Map: maplibre.MockMap,
  AttributionControl: maplibre.MockAttributionControl,
  Popup: maplibre.MockPopup,
  setWorkerUrl: maplibre.setWorkerUrl,
}));

vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({
  default: '/assets/maplibre-gl-worker.js',
}));

// jsdom has no matchMedia: a stub whose `change` listeners the tests can fire.
type ChangeListener = (event: { matches: boolean }) => void;

function stubMatchMedia(matches: boolean, reducedMotion = false) {
  const listeners = new Set<ChangeListener>();
  const query = {
    matches,
    addEventListener: vi.fn<(type: 'change', listener: ChangeListener) => void>(
      (_type, listener) => {
        listeners.add(listener);
      },
    ),
    removeEventListener: vi.fn<(type: 'change', listener: ChangeListener) => void>(
      (_type, listener) => {
        listeners.delete(listener);
      },
    ),
  };
  const matchMedia = vi.fn<(media: string) => typeof query>((media) =>
    media === REDUCED_MOTION_QUERY ? { ...query, matches: reducedMotion } : query,
  );
  vi.stubGlobal('matchMedia', matchMedia);
  const change = (next: boolean) => listeners.forEach((listener) => listener({ matches: next }));
  return { matchMedia, query, listeners, change };
}

function renderedMap() {
  expect(maplibre.instances).toHaveLength(1);
  const [map] = maplibre.instances;
  if (!map) throw new Error('map was not created');
  return map;
}

describe('BaseMap', () => {
  beforeEach(() => {
    maplibre.instances.length = 0;
    stubMatchMedia(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('points MapLibre at the worker bundled by Vite', () => {
    expect(maplibre.workerUrls).toEqual(['/assets/maplibre-gl-worker.js']);
  });

  it('creates the map once in its container, centered on Madrid with the OpenFreeMap style, between zoom 12 and 18', () => {
    const { getByRole } = render(<BaseMap />);

    expect(renderedMap().options).toEqual({
      container: getByRole('region', { name: 'Mapa de Madrid' }),
      style: MAP_STYLE_URL,
      center: MADRID_CENTER,
      zoom: MADRID_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: false,
    });
  });

  it('adds a compact attribution control', () => {
    render(<BaseMap />);

    const [control] = renderedMap().addControl.mock.calls[0] ?? [];
    expect(control).toBeInstanceOf(maplibre.MockAttributionControl);
    expect(control).toHaveProperty('options', { compact: true });
  });

  it('places the attribution at the top right below md, clear of the bottom sheet', () => {
    const { matchMedia } = stubMatchMedia(false);
    render(<BaseMap />);

    expect(matchMedia).toHaveBeenCalledWith(MD_MEDIA_QUERY);
    expect(renderedMap().addControl.mock.calls[0]?.[1]).toBe('top-right');
  });

  it('places the attribution at the bottom right from md up', () => {
    stubMatchMedia(true);
    render(<BaseMap />);

    expect(renderedMap().addControl.mock.calls[0]?.[1]).toBe('bottom-right');
  });

  it('moves the attribution when the viewport crosses md', () => {
    const { change } = stubMatchMedia(false);
    render(<BaseMap />);
    const map = renderedMap();
    const [first] = map.addControl.mock.calls[0] ?? [];

    change(true);

    expect(map.removeControl).toHaveBeenCalledWith(first);
    const [second, position] = map.addControl.mock.calls[1] ?? [];
    expect(second).toBeInstanceOf(maplibre.MockAttributionControl);
    expect(position).toBe('bottom-right');
  });

  it('stops listening to the breakpoint on unmount', () => {
    const { listeners, query } = stubMatchMedia(false);
    const { unmount } = render(<BaseMap />);
    expect(listeners.size).toBe(1);

    unmount();

    expect(query.removeEventListener).toHaveBeenCalledOnce();
    expect(listeners.size).toBe(0);
  });

  it('removes the map on unmount', () => {
    const { unmount } = render(<BaseMap />);
    const map = renderedMap();
    expect(map.remove).not.toHaveBeenCalled();

    unmount();

    expect(map.remove).toHaveBeenCalledOnce();
  });

  it('names the container with the given label', () => {
    const { getByRole } = render(<BaseMap label="Mapa de estaciones" />);

    expect(getByRole('region', { name: 'Mapa de estaciones' })).toBeInTheDocument();
  });

  it('applies the given class name to the container', () => {
    const { getByRole } = render(<BaseMap className="h-full" />);

    expect(getByRole('region', { name: 'Mapa de Madrid' })).toHaveClass('h-full');
  });
});

const points: MapPoint[] = [
  { id: '1a', lng: -3.7038, lat: 40.4168, value: '7', tone: 'success' },
  { id: '2', lng: -3.7059, lat: 40.42, value: '0', tone: 'danger' },
];

function loadedMap() {
  const map = renderedMap();
  act(() => map.fire('load'));
  return map;
}

function lastData(map: InstanceType<typeof maplibre.MockMap>, sourceId: string) {
  return map.getSource(sourceId)?.setData.mock.lastCall?.[0];
}

describe('BaseMap points', () => {
  beforeEach(() => {
    maplibre.instances.length = 0;
    stubMatchMedia(true);
    document.documentElement.style.setProperty('--color-tone-success', '#0f7a43');
    document.documentElement.style.setProperty('--color-map-user-location', '#2563eb');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('style');
  });

  it('adds nothing until the style loads', () => {
    render(<BaseMap points={points} />);

    expect(renderedMap().addSource).not.toHaveBeenCalled();
    expect(renderedMap().addLayer).not.toHaveBeenCalled();
  });

  it('adds the points and user location sources and layers once, after the style loads', () => {
    const { rerender } = render(<BaseMap points={points} />);
    const map = loadedMap();
    rerender(<BaseMap points={[...points]} />);

    expect(map.addSource.mock.calls.map(([id]) => id)).toEqual([
      POINTS_SOURCE_ID,
      USER_LOCATION_SOURCE_ID,
    ]);
    expect(map.addLayer.mock.calls.map(([layer]) => layer.id)).toEqual([
      POINT_LAYER_ID,
      USER_LOCATION_HALO_LAYER_ID,
      USER_LOCATION_LAYER_ID,
    ]);
  });

  it('paints the user location with the theme color', () => {
    render(<BaseMap points={points} />);
    const map = loadedMap();

    const layers = map.addLayer.mock.calls.map(([layer]) => JSON.stringify(layer));
    expect(layers[1]).toContain('#2563eb');
  });

  it('paints the point images on demand until the map is removed', () => {
    const { unmount } = render(<BaseMap points={points} />);
    const map = loadedMap();
    expect(map.setMissingStyleImageResolver).toHaveBeenCalledExactlyOnceWith(expect.any(Function));

    unmount();

    expect(map.setMissingStyleImageResolver).toHaveBeenLastCalledWith(null);
  });

  it('paints the image a point asks for, selected or not', async () => {
    // jsdom cannot draw: a context whose every method does nothing.
    const context = new Proxy({}, { get: () => () => ({}) });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as CanvasRenderingContext2D,
    );
    render(<BaseMap points={points} selectedId="2" />);
    const map = loadedMap();
    const resolve = map.setMissingStyleImageResolver.mock.lastCall?.[0];
    const imageIds = toFeatureCollection(points, '2').features.map(
      (feature) => feature.properties.imageId,
    );

    for (const id of imageIds) await resolve?.(id);

    expect(map.addImage.mock.calls.map(([id]) => id)).toEqual(imageIds);
  });

  it('applies the points passed before the style loaded', () => {
    render(<BaseMap points={points} selectedId="2" />);
    const map = loadedMap();

    expect(lastData(map, POINTS_SOURCE_ID)).toEqual(toFeatureCollection(points, '2'));
  });

  it('updates the source data when points or selection change, without recreating the map', () => {
    const { rerender } = render(<BaseMap points={points} />);
    const map = loadedMap();
    const [first] = points;

    rerender(<BaseMap points={[first as MapPoint]} />);
    expect(lastData(map, POINTS_SOURCE_ID)).toEqual(toFeatureCollection([first as MapPoint]));

    rerender(<BaseMap points={[first as MapPoint]} selectedId="1a" />);
    expect(lastData(map, POINTS_SOURCE_ID)).toEqual(toFeatureCollection([first as MapPoint], '1a'));
    expect(maplibre.instances).toHaveLength(1);
  });

  it('fills the points source with the image of each square icon point', () => {
    const stops: MapPoint[] = [
      { id: '72', lng: -3.7038, lat: 40.4168, tone: 'info', shape: 'square', icon: 'bus' },
      { id: '73', lng: -3.7059, lat: 40.42, tone: 'info', shape: 'square', icon: 'bus' },
    ];
    render(<BaseMap points={stops} selectedId="73" />);
    const map = loadedMap();

    expect(lastData(map, POINTS_SOURCE_ID)).toEqual(toFeatureCollection(stops, '73'));
  });

  it('draws the user location in its own source', () => {
    const { rerender } = render(<BaseMap />);
    const map = loadedMap();
    expect(lastData(map, USER_LOCATION_SOURCE_ID)).toEqual(toUserLocationCollection(undefined));

    rerender(<BaseMap userLocation={{ lng: -3.7, lat: 40.4 }} />);

    expect(lastData(map, USER_LOCATION_SOURCE_ID)).toEqual(
      toUserLocationCollection({ lng: -3.7, lat: 40.4 }),
    );
  });

  it('selects the clicked point with the latest callback', () => {
    const first = vi.fn<(id: string) => void>();
    const latest = vi.fn<(id: string) => void>();
    const { rerender } = render(<BaseMap points={points} onSelectPoint={first} />);
    const map = loadedMap();
    rerender(<BaseMap points={points} onSelectPoint={latest} />);

    map.fire('click', POINT_LAYER_ID, { features: [{ properties: { id: '2' } }] });

    expect(latest).toHaveBeenCalledExactlyOnceWith('2');
    expect(first).not.toHaveBeenCalled();
  });

  it('ignores a click without a point', () => {
    const onSelectPoint = vi.fn<(id: string) => void>();
    render(<BaseMap points={points} onSelectPoint={onSelectPoint} />);
    const map = loadedMap();

    map.fire('click', POINT_LAYER_ID, { features: [] });

    expect(onSelectPoint).not.toHaveBeenCalled();
  });

  it('shows a pointer cursor over the points', () => {
    render(<BaseMap points={points} />);
    const map = loadedMap();

    map.fire('mouseenter', POINT_LAYER_ID);
    expect(map.canvas.style.cursor).toBe('pointer');

    map.fire('mouseleave', POINT_LAYER_ID);
    expect(map.canvas.style.cursor).toBe('');
  });

  it('eases to the focus once loaded and when it changes', () => {
    const { rerender } = render(<BaseMap focus={{ lng: -3.7, lat: 40.4 }} />);
    const map = renderedMap();
    expect(map.easeTo).not.toHaveBeenCalled();

    act(() => map.fire('load'));
    expect(map.easeTo).toHaveBeenLastCalledWith({ center: [-3.7, 40.4], padding: { bottom: 0 } });

    rerender(<BaseMap focus={{ lng: -3.7, lat: 40.4 }} />);
    expect(map.easeTo).toHaveBeenCalledOnce();

    rerender(<BaseMap focus={{ lng: -3.71, lat: 40.41 }} />);
    expect(map.easeTo).toHaveBeenLastCalledWith({
      center: [-3.71, 40.41],
      padding: { bottom: 0 },
    });
  });

  it('centers the focus in the area above the bottom padding', () => {
    render(<BaseMap focus={{ lng: -3.7, lat: 40.4 }} focusPadding={{ bottom: 400 }} />);
    const map = loadedMap();

    expect(map.easeTo).toHaveBeenCalledExactlyOnceWith({
      center: [-3.7, 40.4],
      padding: { bottom: 400 },
    });
  });

  it('eases again to the same focus when the padding changes, not on an equal padding', () => {
    const focus = { lng: -3.7, lat: 40.4 };
    const { rerender } = render(<BaseMap focus={focus} focusPadding={{ bottom: 400 }} />);
    const map = loadedMap();

    rerender(<BaseMap focus={focus} focusPadding={{ bottom: 400 }} />);
    expect(map.easeTo).toHaveBeenCalledOnce();

    rerender(<BaseMap focus={focus} focusPadding={{ bottom: 0 }} />);
    expect(map.easeTo).toHaveBeenLastCalledWith({ center: [-3.7, 40.4], padding: { bottom: 0 } });
    expect(map.easeTo).toHaveBeenCalledTimes(2);
  });

  it('centers the focus clear of the right padding too, when given', () => {
    render(<BaseMap focus={{ lng: -3.7, lat: 40.4 }} focusPadding={{ bottom: 0, right: 352 }} />);
    const map = loadedMap();

    expect(map.easeTo).toHaveBeenCalledExactlyOnceWith({
      center: [-3.7, 40.4],
      padding: { bottom: 0, right: 352 },
    });
  });

  it('does not move the map on a padding change without a focus', () => {
    const { rerender } = render(<BaseMap focusPadding={{ bottom: 400 }} />);
    const map = loadedMap();

    rerender(<BaseMap focusPadding={{ bottom: 0 }} />);

    expect(map.easeTo).not.toHaveBeenCalled();
  });

  it('jumps to the focus without animation when the user prefers reduced motion', () => {
    stubMatchMedia(true, true);
    render(<BaseMap focus={{ lng: -3.7, lat: 40.4 }} focusPadding={{ bottom: 400 }} />);
    const map = loadedMap();

    expect(map.easeTo).toHaveBeenCalledExactlyOnceWith({
      center: [-3.7, 40.4],
      padding: { bottom: 400 },
      duration: 0,
    });
  });

  it('fits the map to the fit points once loaded and when they move', () => {
    const fitPoints = [
      { lng: -3.7, lat: 40.4 },
      { lng: -3.71, lat: 40.42 },
    ];
    const { rerender } = render(<BaseMap fitPoints={fitPoints} />);
    const map = renderedMap();
    expect(map.fitBounds).not.toHaveBeenCalled();

    act(() => map.fire('load'));
    expect(map.fitBounds).toHaveBeenLastCalledWith(
      [
        [-3.71, 40.4],
        [-3.7, 40.42],
      ],
      { padding: { bottom: 0 } },
    );

    rerender(<BaseMap fitPoints={fitPoints} />);
    expect(map.fitBounds).toHaveBeenCalledOnce();

    rerender(<BaseMap fitPoints={[{ lng: -3.7, lat: 40.41 }]} />);
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
  });

  it('fits the points above the bottom padding, without animation for reduced motion', () => {
    stubMatchMedia(true, true);
    render(<BaseMap fitPoints={[{ lng: -3.7, lat: 40.4 }]} focusPadding={{ bottom: 400 }} />);
    const map = loadedMap();

    expect(map.fitBounds).toHaveBeenCalledExactlyOnceWith(
      [
        [-3.7, 40.4],
        [-3.7, 40.4],
      ],
      { padding: { bottom: 400 }, duration: 0 },
    );
  });

  it('fits the points instead of easing to the focus while they are set', () => {
    render(<BaseMap focus={{ lng: -3.7, lat: 40.4 }} fitPoints={[{ lng: -3.71, lat: 40.41 }]} />);
    const map = loadedMap();

    expect(map.easeTo).not.toHaveBeenCalled();
    expect(map.fitBounds).toHaveBeenCalledOnce();
  });
});

describe('BaseMap controls', () => {
  beforeEach(() => {
    maplibre.instances.length = 0;
    stubMatchMedia(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has no controls unless asked for', () => {
    render(<BaseMap />);
    loadedMap();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the controls inside the map once it loads', () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    expect(screen.queryByRole('button', { name: 'Acercar' })).not.toBeInTheDocument();

    loadedMap();

    const region = screen.getByRole('region', { name: 'Mapa de Madrid' });
    expect(region).toContainElement(screen.getByRole('button', { name: 'Acercar' }));
    expect(region).toHaveClass('isolate');
  });

  it('zooms the map in and out', async () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    const map = loadedMap();

    await userEvent.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(map.zoomIn).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('button', { name: 'Alejar' }));
    expect(map.zoomOut).toHaveBeenCalledOnce();
    expect(map.zoomIn).toHaveBeenCalledOnce();
  });

  it('recenters with the given action', async () => {
    const onRecenter = vi.fn<() => void>();
    render(<BaseMap controls={{ onRecenter }} />);
    const map = loadedMap();

    await userEvent.click(screen.getByRole('button', { name: 'Centrar en mi posición' }));

    expect(onRecenter).toHaveBeenCalledOnce();
    expect(map.zoomIn).not.toHaveBeenCalled();
    expect(map.zoomOut).not.toHaveBeenCalled();
  });

  it('shows the zoom controls without «Centrar en mi posición» when there is no recenter action', () => {
    render(<BaseMap controls={{}} />);
    loadedMap();

    expect(screen.getByRole('button', { name: 'Acercar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Centrar en mi posición' }),
    ).not.toBeInTheDocument();
  });

  it('marks «Centrar en mi posición» busy while recentering', () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>(), isRecentering: true }} />);
    loadedMap();

    expect(screen.getByRole('button', { name: 'Centrar en mi posición' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('stacks zoom in, zoom out and recenter, in that order', () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    loadedMap();

    expect(
      screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Acercar', 'Alejar', 'Centrar en mi posición']);
  });

  it('groups the zoom buttons in one box, with «Centrar en mi posición» floating apart', () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    loadedMap();

    const zoom = screen.getByRole('group', { name: 'Zoom del mapa' });
    expect(within(zoom).getByRole('button', { name: 'Acercar' })).toBeInTheDocument();
    expect(within(zoom).getByRole('button', { name: 'Alejar' })).toBeInTheDocument();
    const recenter = screen.getByRole('button', { name: 'Centrar en mi posición' });
    expect(zoom).not.toContainElement(recenter);
    expect(recenter).toHaveClass('bg-surface', 'shadow-control', 'rounded-control');
  });

  it('sits above the compact attribution in the bottom right corner', () => {
    render(<BaseMap controls={{}} />);
    loadedMap();

    expect(screen.getByRole('group', { name: 'Zoom del mapa' }).parentElement).toHaveClass(
      'absolute',
      'right-4',
      'bottom-12',
      'z-10',
    );
  });

  it('draws plus and minus in grey and the locate icon in primary blue', () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    loadedMap();

    expect(firstIconPath(screen.getByRole('button', { name: 'Acercar' }))).toBe(iconPath('plus'));
    expect(firstIconPath(screen.getByRole('button', { name: 'Alejar' }))).toBe(iconPath('minus'));
    expect(firstIconPath(screen.getByRole('button', { name: 'Centrar en mi posición' }))).toBe(
      iconPath('locate'),
    );

    expect(screen.getByRole('button', { name: 'Acercar' })).toHaveClass('text-fg-muted');
    expect(screen.getByRole('button', { name: 'Alejar' })).toHaveClass('text-fg-muted');
    expect(screen.getByRole('button', { name: 'Centrar en mi posición' })).toHaveClass(
      'text-primary',
    );
  });

  it('makes each button a 44 px target with a decorative 20 px icon', () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    loadedMap();

    screen.getAllByRole('button').forEach((button) => {
      expect(button).toHaveClass('size-11');
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(button.querySelector('svg')).toHaveAttribute('width', '20');
    });
  });

  // aria-disabled, not disabled: the button keeps the focus the user just put on it.
  it('keeps «Centrar en mi posición» focusable but busy while recentering, ignoring clicks', async () => {
    const onRecenter = vi.fn<() => void>();
    render(<BaseMap controls={{ onRecenter, isRecentering: true }} />);
    loadedMap();
    const button = screen.getByRole('button', { name: 'Centrar en mi posición' });

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeEnabled();
    expect(onRecenter).not.toHaveBeenCalled();
  });

  it('is neither busy nor disabled while not recentering', () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    loadedMap();

    const button = screen.getByRole('button', { name: 'Centrar en mi posición' });
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  it('tabs through zoom in, zoom out and recenter', async () => {
    render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    loadedMap();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Acercar' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Alejar' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Centrar en mi posición' })).toHaveFocus();
  });

  it('has no axe violations with the controls', async () => {
    const { container } = render(<BaseMap controls={{ onRecenter: vi.fn<() => void>() }} />);
    loadedMap();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});

function popupFor(overrides: Partial<MapPopup> = {}): MapPopup {
  return {
    at: { lng: -3.7038, lat: 40.4168 },
    label: 'Parada 72',
    content: <p>Puerta del Sol</p>,
    onClose: vi.fn<() => void>(),
    ...overrides,
  };
}

describe('BaseMap popup', () => {
  beforeEach(() => {
    maplibre.instances.length = 0;
    maplibre.popups.length = 0;
    stubMatchMedia(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens a MapLibre popup at its point, without its own close controls', () => {
    const popup = popupFor();
    render(<BaseMap popup={popup} />);
    loadedMap();

    expect(maplibre.popups).toHaveLength(1);
    expect(maplibre.popups[0]?.options).toMatchObject({ closeButton: false, closeOnClick: false });
    expect(maplibre.popups[0]?.lngLat).toEqual(popup.at);
  });

  it('shows its content in a dialog named by its label', () => {
    render(<BaseMap popup={popupFor({ content: <p>Líneas 3 · N1</p> })} />);
    loadedMap();

    expect(
      within(screen.getByRole('dialog', { name: 'Parada 72' })).getByText('Líneas 3 · N1'),
    ).toBeInTheDocument();
  });

  it('moves to a new point, and goes away without calling onClose when the point is gone', () => {
    const onClose = vi.fn<() => void>();
    const { rerender } = render(<BaseMap popup={popupFor({ onClose })} />);
    loadedMap();
    const [first] = maplibre.popups;

    rerender(<BaseMap popup={popupFor({ at: { lng: -3.7059, lat: 40.42 }, onClose })} />);
    expect(first?.remove).toHaveBeenCalledOnce();
    expect(maplibre.popups.at(-1)?.lngLat).toEqual({ lng: -3.7059, lat: 40.42 });

    rerender(<BaseMap />);
    expect(maplibre.popups.at(-1)?.remove).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes with its close button, which has a name', async () => {
    const onClose = vi.fn<() => void>();
    render(<BaseMap popup={popupFor({ onClose })} />);
    loadedMap();

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes with Escape from inside it', async () => {
    const onClose = vi.fn<() => void>();
    render(<BaseMap popup={popupFor({ onClose })} />);
    loadedMap();

    act(() => screen.getByRole('button', { name: 'Cerrar' }).focus());
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });
});
