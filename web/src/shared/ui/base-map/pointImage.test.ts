import type { MapColors } from './mapColors';
import { createPointImage, paintPoint, type PointPainter, type PointStyle } from './pointImage';

const colors: MapColors = {
  tones: {
    good: { fill: '#good', text: '#good-text' },
    low: { fill: '#low', text: '#low-text' },
    empty: { fill: '#empty', text: '#empty-text' },
    off: { fill: '#off', text: '#off-text' },
    unconfirmed: { fill: '#unconfirmed', text: '#unconfirmed-text' },
  },
  userLocation: '#user',
  pointStroke: '#stroke',
  pointSelectedStroke: '#selected-stroke',
  emptyStroke: '#empty-stroke',
};

const style: PointStyle = { colors, fontFamily: 'Inter Variable, sans-serif' };

type Call = [name: string, ...args: unknown[]];

// Records each drawing call with the styles in force at that moment, like a real 2D context.
function recordingPainter() {
  const calls: Call[] = [];
  const painter: PointPainter = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    scale: (x, y) => void calls.push(['scale', x, y]),
    beginPath: () => void calls.push(['beginPath']),
    arc: (x, y, radius) => void calls.push(['arc', x, y, radius]),
    fill: () => void calls.push(['fill', painter.fillStyle]),
    stroke: () => void calls.push(['stroke', painter.strokeStyle, painter.lineWidth]),
    fillText: (text, x, y) =>
      void calls.push([
        'fillText',
        text,
        x,
        y,
        painter.fillStyle,
        painter.font,
        painter.textAlign,
        painter.textBaseline,
      ]),
  };
  return { painter, calls };
}

function paint(spec: Parameters<typeof paintPoint>[1]) {
  const { painter, calls } = recordingPainter();
  paintPoint(painter, spec, style);
  return calls;
}

describe('paintPoint', () => {
  it('draws a 40 px circle in the tone color with a 1.5 px ring in the point stroke color', () => {
    expect(paint({ tone: 'good', selected: false, label: '7' })).toEqual([
      ['beginPath'],
      ['arc', 21.5, 21.5, 20.75],
      ['fill', '#good'],
      ['stroke', '#stroke', 1.5],
      [
        'fillText',
        '7',
        21.5,
        21.5,
        '#good-text',
        '700 14px Inter Variable, sans-serif',
        'center',
        'middle',
      ],
    ]);
  });

  it('rings the empty tone with a 2 px line in its own color', () => {
    const calls = paint({ tone: 'empty', selected: false, label: '0' });

    expect(calls).toContainEqual(['arc', 22, 22, 21]);
    expect(calls).toContainEqual(['fill', '#empty']);
    expect(calls).toContainEqual(['stroke', '#empty-stroke', 2]);
  });

  it('draws the selected point 48 px wide with a 3 px ring in the selection color', () => {
    const calls = paint({ tone: 'empty', selected: true, label: '0' });

    expect(calls).toContainEqual(['arc', 27, 27, 25.5]);
    expect(calls).toContainEqual(['stroke', '#selected-stroke', 3]);
  });

  it.each(['low', 'off', 'unconfirmed'] as const)(
    'writes the label of the %s tone in its text color',
    (tone) => {
      const text = paint({ tone, selected: false, label: '–' }).find(
        ([name]) => name === 'fillText',
      );

      expect(text?.slice(1, 2)).toEqual(['–']);
      expect(text?.[4]).toBe(`#${tone}-text`);
    },
  );
});

describe('createPointImage', () => {
  const imageData = { width: 86, height: 86, data: new Uint8ClampedArray() } as ImageData;

  afterEach(() => vi.restoreAllMocks());

  it('paints the point at the pixel ratio and returns its pixels', () => {
    const { painter, calls } = recordingPainter();
    const getImageData = vi.fn<CanvasRenderingContext2D['getImageData']>(() => imageData);
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ ...painter, getImageData } as unknown as CanvasRenderingContext2D);

    const image = createPointImage({ tone: 'good', selected: false, label: '7' }, style, 2);

    expect(getContext).toHaveBeenCalledWith('2d');
    expect(calls[0]).toEqual(['scale', 2, 2]);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 86, 86);
    expect(image).toBe(imageData);
  });

  it('returns nothing when the browser gives no 2D context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    expect(
      createPointImage({ tone: 'good', selected: false, label: '7' }, style, 1),
    ).toBeUndefined();
  });
});
