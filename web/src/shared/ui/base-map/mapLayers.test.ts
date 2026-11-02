import type { MapColors } from './mapColors';
import { paintMissingPointImages, type PointImageHost } from './mapLayers';
import { createPointImage } from './pointImage';
import type * as PointImageModule from './pointImage';

vi.mock('./pointImage', async (importOriginal) => ({
  ...(await importOriginal<typeof PointImageModule>()),
  createPointImage: vi.fn<() => ImageData | undefined>(),
}));

type MissingListener = (event: { id: string }) => void;

const style = { colors: {} as MapColors, fontFamily: 'sans-serif' };
const image = { width: 1, height: 1, data: new Uint8ClampedArray(4) } as ImageData;

function fakeMap(existingIds: string[] = []) {
  const listeners = new Set<MissingListener>();
  const map = {
    hasImage: (id: string) => existingIds.includes(id),
    addImage: vi.fn<PointImageHost['addImage']>(),
    updateImage: vi.fn<PointImageHost['updateImage']>(),
    on: (_type: 'styleimagemissing', listener: MissingListener) => listeners.add(listener),
    off: (_type: 'styleimagemissing', listener: MissingListener) => listeners.delete(listener),
  } satisfies PointImageHost;
  const requestImage = (id: string) => listeners.forEach((listener) => listener({ id }));
  return { map, listeners, requestImage };
}

function stubFontLoading() {
  let finishLoading = () => {};
  const loaded = new Promise<void>((resolve) => {
    finishLoading = resolve;
  });
  const load = vi.fn<(font: string) => Promise<void>>(() => loaded);
  vi.stubGlobal('document', Object.assign(Object.create(document), { fonts: { load } }));
  return {
    load,
    finishLoading: async () => {
      finishLoading();
      await loaded;
    },
  };
}

describe('paintMissingPointImages', () => {
  beforeEach(() => {
    vi.stubGlobal('devicePixelRatio', 3);
    vi.mocked(createPointImage).mockReturnValue(image);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('repaints the images painted before the font loaded, in the font', async () => {
    const fonts = stubFontLoading();
    const { map, requestImage } = fakeMap();

    paintMissingPointImages(map, style);
    requestImage('point:good:0:12');
    await fonts.finishLoading();

    expect(fonts.load).toHaveBeenCalledExactlyOnceWith('700 14px sans-serif');
    expect(map.updateImage).toHaveBeenCalledExactlyOnceWith('point:good:0:12', image);
  });

  it('repaints nothing once stopped', async () => {
    const fonts = stubFontLoading();
    const { map, requestImage } = fakeMap();

    const stop = paintMissingPointImages(map, style);
    requestImage('point:good:0:12');
    stop();
    await fonts.finishLoading();

    expect(map.updateImage).not.toHaveBeenCalled();
  });

  it('paints a missing point image at the pixel ratio, capped at 2', () => {
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style);

    requestImage('point:low:1:25A');

    expect(createPointImage).toHaveBeenCalledWith(
      { tone: 'low', selected: true, label: '25A' },
      style,
      2,
    );
    expect(map.addImage).toHaveBeenCalledExactlyOnceWith('point:low:1:25A', image, {
      pixelRatio: 2,
    });
  });

  it('never paints an image the map already has', () => {
    const { map, requestImage } = fakeMap(['point:good:0:7']);
    paintMissingPointImages(map, style);

    requestImage('point:good:0:7');

    expect(createPointImage).not.toHaveBeenCalled();
    expect(map.addImage).not.toHaveBeenCalled();
  });

  it('leaves other missing images to the map style', () => {
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style);

    requestImage('road-shield');

    expect(map.addImage).not.toHaveBeenCalled();
  });

  it('adds nothing when the image cannot be painted', () => {
    vi.mocked(createPointImage).mockReturnValue(undefined);
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style);

    requestImage('point:good:0:7');

    expect(map.addImage).not.toHaveBeenCalled();
  });

  it('stops listening when stopped', () => {
    const { map, listeners } = fakeMap();

    const stop = paintMissingPointImages(map, style);
    expect(listeners.size).toBe(1);
    stop();

    expect(listeners.size).toBe(0);
  });
});
