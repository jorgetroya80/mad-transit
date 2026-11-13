import { ICON_DRAWINGS } from '../icons';
import {
  drawMapPoint,
  type MapPointPainter,
  mapPointSize,
  mapPointValueFont,
} from './drawMapPoint';
import { MAP_POINT_TONES, type MapPointParams } from './mapPointParams';
import type { MapPointStyle } from './mapPointStyle';

const style: MapPointStyle = {
  colors: {
    tones: {
      success: { fill: '#success', text: '#success-text' },
      warning: { fill: '#warning', text: '#warning-text' },
      danger: { fill: '#danger', text: '#danger-text' },
      neutral: { fill: '#neutral', text: '#neutral-text' },
      muted: { fill: '#muted', text: '#muted-text' },
      info: { fill: '#info', text: '#info-text' },
    },
    lines: { danger: '#danger-line', muted: '#muted-line' },
    tag: '#tag',
    halo: '#halo',
    selectedRing: '#ring',
  },
  fontFamily: 'Inter Variable, sans-serif',
};

const FONT = '700 15px Inter Variable, sans-serif';

type Call = [name: string, ...args: unknown[]];

class RecordedPath2D {
  constructor(readonly d: string) {}
}

function pathOf(path: unknown) {
  return path instanceof RecordedPath2D ? path.d : undefined;
}

// Records each drawing call with the styles in force at that moment, like a real 2D context.
function recordingPainter() {
  const calls: Call[] = [];
  const painter: MapPointPainter = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    scale: (x, y) => void calls.push(['scale', x, y]),
    translate: (x, y) => void calls.push(['translate', x, y]),
    save: () => void calls.push(['save']),
    restore: () => void calls.push(['restore']),
    beginPath: () => void calls.push(['beginPath']),
    arc: (x, y, radius) => void calls.push(['arc', x, y, radius]),
    roundRect: (...args) => void calls.push(['roundRect', ...args]),
    fill: (path?: unknown) => void calls.push(['fill', painter.fillStyle, pathOf(path)]),
    stroke: (path?: Path2D) =>
      void calls.push([
        'stroke',
        painter.strokeStyle,
        painter.lineWidth,
        pathOf(path),
        painter.lineCap,
        painter.lineJoin,
      ]),
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

function draw(params: MapPointParams, pixelRatio = 1) {
  const { painter, calls } = recordingPainter();
  drawMapPoint(painter, params, { pixelRatio, style });
  return calls;
}

beforeEach(() => vi.stubGlobal('Path2D', RecordedPath2D));

describe('drawMapPoint', () => {
  it.each(MAP_POINT_TONES.filter((tone) => tone !== 'danger' && tone !== 'muted'))(
    'draws a 40 px %s circle with its value inside a 2 px halo',
    (tone) => {
      expect(draw({ tone, value: '12' })).toEqual([
        ['scale', 1, 1],
        ['beginPath'],
        ['arc', 22, 22, 21],
        ['fill', `#${tone}`, undefined],
        ['stroke', '#halo', 2, undefined, 'butt', 'miter'],
        ['fillText', '12', 22, 22, `#${tone}-text`, FONT, 'center', 'middle'],
      ]);
    },
  );

  it.each(['danger', 'muted'] as const)(
    'borders the %s circle with its own solid 2 px line instead of the halo',
    (tone) => {
      const calls = draw({ tone, value: '0' });

      expect(calls).toContainEqual(['fill', `#${tone}`, undefined]);
      expect(calls).toContainEqual(['stroke', `#${tone}-line`, 2, undefined, 'butt', 'miter']);
      expect(calls.find(([name]) => name === 'fillText')?.[4]).toBe(`#${tone}-text`);
    },
  );

  it.each(MAP_POINT_TONES)(
    'draws the selected %s circle 48 px wide in a 4 px selection ring',
    (tone) => {
      expect(draw({ tone, value: '3', selected: true })).toEqual([
        ['scale', 1, 1],
        ['beginPath'],
        ['arc', 28, 28, 26],
        ['fill', `#${tone}`, undefined],
        ['stroke', '#ring', 4, undefined, 'butt', 'miter'],
        ['fillText', '3', 28, 28, `#${tone}-text`, FONT, 'center', 'middle'],
      ]);
    },
  );

  it('draws a 32 px square with radius 8 and the bus icon at 16 px, in the tag fill', () => {
    const { paths, strokeWidth } = ICON_DRAWINGS.bus;
    const calls = draw({ tone: 'neutral', shape: 'square', fill: 'tag', icon: 'bus' });

    expect(calls).toEqual([
      ['scale', 1, 1],
      ['beginPath'],
      ['roundRect', 1, 1, 34, 34, 9],
      ['fill', '#tag', undefined],
      ['stroke', '#halo', 2, undefined, 'butt', 'miter'],
      ['save'],
      ['translate', 10, 10],
      ['scale', 2 / 3, 2 / 3],
      ...paths.map((d) => ['stroke', '#neutral-text', strokeWidth, d, 'round', 'round']),
      ['restore'],
    ]);
  });

  it('draws a 72 by 32 pill with the bus icon and its line in one image, in the tag fill', () => {
    const { paths, strokeWidth } = ICON_DRAWINGS.bus;
    const calls = draw({ tone: 'info', shape: 'pill', fill: 'tag', icon: 'bus', value: '27' });

    expect(calls).toEqual([
      ['scale', 1, 1],
      ['beginPath'],
      ['roundRect', 1, 21, 74, 34, 17],
      ['fill', '#tag', undefined],
      ['stroke', '#halo', 2, undefined, 'butt', 'miter'],
      ['save'],
      ['translate', 12, 30],
      ['scale', 2 / 3, 2 / 3],
      ...paths.map((d) => ['stroke', '#info-text', strokeWidth, d, 'round', 'round']),
      ['restore'],
      ['fillText', '27', 46, 38, '#info-text', FONT, 'center', 'middle'],
    ]);
  });

  it('draws the selected square 40 px wide with radius 10 in the selection ring', () => {
    const calls = draw({ tone: 'info', shape: 'square', fill: 'tag', icon: 'bus', selected: true });

    expect(calls.slice(0, 7)).toEqual([
      ['scale', 1, 1],
      ['beginPath'],
      ['roundRect', 2, 2, 44, 44, 12],
      ['fill', '#tag', undefined],
      ['stroke', '#ring', 4, undefined, 'butt', 'miter'],
      ['save'],
      ['translate', 16, 16],
    ]);
    expect(calls.filter(([name, , , path]) => name === 'stroke' && path)).toHaveLength(
      ICON_DRAWINGS.bus.paths.length,
    );
  });

  it('fills a filled icon as well as stroking it', () => {
    const [d] = ICON_DRAWINGS['star-filled'].paths;
    const calls = draw({ tone: 'warning', shape: 'square', icon: 'star-filled' });

    expect(calls).toContainEqual(['fill', '#warning-text', d]);
    expect(calls).toContainEqual(['stroke', '#warning-text', 2, d, 'round', 'round']);
  });

  it('draws only the shape when it has neither value nor icon', () => {
    const names = draw({ tone: 'success' }).map(([name]) => name);

    expect(names).toEqual(['scale', 'beginPath', 'arc', 'fill', 'stroke']);
  });

  it('scales the drawing to the pixel ratio first', () => {
    expect(draw({ tone: 'success', value: '3' }, 2)[0]).toEqual(['scale', 2, 2]);
  });
});

describe('mapPointValueFont', () => {
  it('gives the font the value is drawn in, so the caller can wait for that same font', () => {
    expect(mapPointValueFont(style)).toBe(FONT);
  });
});

describe('mapPointSize', () => {
  it.each<[string, MapPointParams, number]>([
    ['circle', { tone: 'success', value: '3' }, 44],
    ['selected circle', { tone: 'success', value: '3', selected: true }, 56],
    ['square', { tone: 'neutral', shape: 'square', icon: 'bus' }, 36],
    ['selected square', { tone: 'info', shape: 'square', icon: 'bus', selected: true }, 48],
    ['pill', { tone: 'info', shape: 'pill', icon: 'bus', value: '27' }, 76],
    ['danger circle', { tone: 'danger', value: '0' }, 44],
    ['muted circle', { tone: 'muted', value: '–' }, 44],
  ])('is the shape plus its border on both sides for the %s', (_case, params, size) => {
    expect(mapPointSize(params)).toBe(size);
  });
});
