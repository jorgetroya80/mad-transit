import type { MapColors } from './mapColors';
import { paintMissingPointImages, type PointImageHost } from './mapLayers';
import { createPointImage } from './pointImage';
import type * as PointImageModule from './pointImage';

vi.mock('./pointImage', async (importOriginal) => ({
  ...(await importOriginal<typeof PointImageModule>()),
  createPointImage: vi.fn<() => ImageData | undefined>(),
}));

type MissingImageResolver = (id: string) => void | Promise<void>;

const style = { colors: {} as MapColors, fontFamily: 'sans-serif' };
const image = { width: 1, height: 1, data: new Uint8ClampedArray(4) } as ImageData;

// Like MapLibre 6, the map asks its resolver for a missing image and only then lays the tile out.
function fakeMap(existingIds: string[] = []) {
  let resolver: MissingImageResolver | null = null;
  const map = {
    hasImage: (id: string) => existingIds.includes(id),
    addImage: vi.fn<PointImageHost['addImage']>(),
    updateImage: vi.fn<PointImageHost['updateImage']>(),
    setMissingStyleImageResolver: (next: MissingImageResolver | null) => {
      resolver = next;
    },
  } satisfies PointImageHost;
  const requestImage = (id: string) => void resolver?.(id);
  const hasResolver = () => resolver !== null;
  return { map, requestImage, hasResolver };
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

  it('adds a missing image before the map lays the tile out', () => {
    const { map, requestImage } = fakeMap();
    paintMissingPointImages(map, style);

    requestImage('point:low:1:4');

    expect(map.addImage).toHaveBeenCalledExactlyOnceWith('point:low:1:4', image, {
      pixelRatio: 2,
    });
  });

  it('stops resolving images when stopped', () => {
    const { map, hasResolver } = fakeMap();

    const stop = paintMissingPointImages(map, style);
    expect(hasResolver()).toBe(true);
    stop();

    expect(hasResolver()).toBe(false);
  });
});
