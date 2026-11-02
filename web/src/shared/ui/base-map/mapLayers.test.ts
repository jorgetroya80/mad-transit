import type { MapColors } from './mapColors';
import { paintMissingPointImages, type PointImageHost } from './mapLayers';
import { createPointImage } from './pointImage';

vi.mock('./pointImage', () => ({ createPointImage: vi.fn<() => ImageData | undefined>() }));

type MissingListener = (event: { id: string }) => void;

const style = { colors: {} as MapColors, fontFamily: 'sans-serif' };
const image = { width: 1, height: 1, data: new Uint8ClampedArray(4) } as ImageData;

function fakeMap(existingIds: string[] = []) {
  const listeners = new Set<MissingListener>();
  const map = {
    hasImage: (id: string) => existingIds.includes(id),
    addImage: vi.fn<PointImageHost['addImage']>(),
    on: (_type: 'styleimagemissing', listener: MissingListener) => listeners.add(listener),
    off: (_type: 'styleimagemissing', listener: MissingListener) => listeners.delete(listener),
  } satisfies PointImageHost;
  const requestImage = (id: string) => listeners.forEach((listener) => listener({ id }));
  return { map, listeners, requestImage };
}

describe('paintMissingPointImages', () => {
  beforeEach(() => {
    vi.stubGlobal('devicePixelRatio', 3);
    vi.mocked(createPointImage).mockReturnValue(image);
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
