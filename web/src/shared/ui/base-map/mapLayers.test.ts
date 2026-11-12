import {
  drawMapPoint,
  MAP_POINT_TONES,
  type MapPointParams,
  type MapPointStyle,
  mapPointImageId,
  mapPointSize,
} from '../map-point';
import type * as MapPointModule from '../map-point';
import { FONT_WAIT_MS, paintMissingPointImages, type PointImageHost } from './mapLayers';

vi.mock('../map-point', async (importOriginal) => ({
  ...(await importOriginal<typeof MapPointModule>()),
  drawMapPoint: vi.fn<typeof drawMapPoint>(),
}));

type MissingImageResolver = (id: string) => void | Promise<void>;

const style = { colors: {}, fontFamily: 'sans-serif' } as MapPointStyle;
const image = { width: 1, height: 1, data: new Uint8ClampedArray(4) } as ImageData;
const low: MapPointParams = { tone: 'warning', value: '4', selected: true };
const lowId = mapPointImageId(low);

// Like MapLibre 6, the map asks its resolver for a missing image, and waits for it, before it
// lays the tile out.
function fakeMap(existingIds: string[] = []) {
  let resolver: MissingImageResolver | null = null;
  const map = {
    hasImage: (id: string) => existingIds.includes(id),
    addImage: vi.fn<PointImageHost['addImage']>(),
    setMissingStyleImageResolver: (next: MissingImageResolver | null) => {
      resolver = next;
    },
  } satisfies PointImageHost;
  const requestImage = async (id: string) => resolver?.(id);
  const hasResolver = () => resolver !== null;
  return { map, requestImage, hasResolver };
}

function stubCanvas(context: object | null = { getImageData: () => image }) {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  getContext.mockReturnValue(context as CanvasRenderingContext2D | null);
  return getContext;
}

// jsdom has no fonts API: a stub that loads, or fails, when the test says so.
function stubFontLoading() {
  let finish = (_isLoaded: boolean) => {};
  const loaded = new Promise<void>((resolve, reject) => {
    finish = (isLoaded) => (isLoaded ? resolve() : reject(new Error('font failed')));
  });
  const load = vi.fn<(font: string) => Promise<void>>(() => loaded);
  Object.defineProperty(document, 'fonts', { value: { load }, configurable: true });
  return { load, finish };
}

describe('paintMissingPointImages', () => {
  beforeEach(() => {
    vi.stubGlobal('devicePixelRatio', 3);
    stubCanvas();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'fonts');
  });

  it.each(MAP_POINT_TONES.filter((tone) => tone !== 'info'))(
    'draws a missing %s point with the library, at the pixel ratio capped at 2',
    async (tone) => {
      const params: MapPointParams = { tone, value: '7', selected: false };
      const id = mapPointImageId(params);
      const { map, requestImage } = fakeMap();
      paintMissingPointImages(map, style).remember([params]);

      await requestImage(id);

      expect(drawMapPoint).toHaveBeenCalledExactlyOnceWith(expect.anything(), params, {
        pixelRatio: 2,
        style,
      });
      expect(map.addImage).toHaveBeenCalledExactlyOnceWith(id, image, { pixelRatio: 2 });
    },
  );

  it('sizes the canvas to the point at the pixel ratio', async () => {
    const getImageData = vi.fn<CanvasRenderingContext2D['getImageData']>(() => image);
    stubCanvas({ getImageData });
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style).remember([low]);

    await requestImage(lowId);

    const side = Math.ceil(mapPointSize(low) * 2);
    expect(getImageData).toHaveBeenCalledExactlyOnceWith(0, 0, side, side);
  });

  it('waits for the value font before drawing, so a point is never drawn twice', async () => {
    const fonts = stubFontLoading();
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style).remember([low]);

    const request = requestImage(lowId);
    await Promise.resolve();
    expect(map.addImage).not.toHaveBeenCalled();
    fonts.finish(true);
    await request;

    expect(fonts.load).toHaveBeenCalledExactlyOnceWith('700 15px sans-serif');
    expect(map.addImage).toHaveBeenCalledExactlyOnceWith(lowId, image, { pixelRatio: 2 });
  });

  it('draws in the fallback font when the value font fails', async () => {
    const fonts = stubFontLoading();
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style).remember([low]);

    const request = requestImage(lowId);
    fonts.finish(false);
    await request;

    expect(map.addImage).toHaveBeenCalledExactlyOnceWith(lowId, image, { pixelRatio: 2 });
  });

  it('draws in the fallback font when the value font hangs past its wait', async () => {
    vi.useFakeTimers();
    try {
      stubFontLoading();
      const { map, requestImage } = fakeMap();
      paintMissingPointImages(map, style).remember([low]);

      const request = requestImage(lowId);
      await vi.advanceTimersByTimeAsync(FONT_WAIT_MS - 1);
      expect(map.addImage).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      await request;

      expect(map.addImage).toHaveBeenCalledExactlyOnceWith(lowId, image, { pixelRatio: 2 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('never paints an image the map already has', async () => {
    const { map, requestImage } = fakeMap([lowId]);
    paintMissingPointImages(map, style).remember([low]);

    await requestImage(lowId);

    expect(drawMapPoint).not.toHaveBeenCalled();
    expect(map.addImage).not.toHaveBeenCalled();
  });

  it('leaves other missing images to the map style', async () => {
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style).remember([low]);

    await requestImage('road-shield');

    expect(map.addImage).not.toHaveBeenCalled();
  });

  it('adds nothing when the canvas cannot draw', async () => {
    stubCanvas(null);
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style).remember([low]);

    await requestImage(lowId);

    expect(map.addImage).not.toHaveBeenCalled();
  });

  it('stops resolving images when stopped', () => {
    const { map, hasResolver } = fakeMap();

    const images = paintMissingPointImages(map, style);
    expect(hasResolver()).toBe(true);
    images.stop();

    expect(hasResolver()).toBe(false);
  });

  it('adds nothing to a map stopped while the font loads', async () => {
    const fonts = stubFontLoading();
    const { map, requestImage } = fakeMap();
    const images = paintMissingPointImages(map, style);
    images.remember([low]);

    const request = requestImage(lowId);
    images.stop();
    fonts.finish(true);
    await request;

    expect(map.addImage).not.toHaveBeenCalled();
  });
});
