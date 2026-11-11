export const ICON_NAMES = [
  'bike',
  'bus',
  'dock',
  'search',
  'close',
  'star',
  'star-filled',
  'chevron-down',
  'chevron-up',
  'chevron-left',
  'pin',
  'clock',
  'wifi-off',
  'cloud-alert',
  'warning',
  'refresh',
  'plus',
  'minus',
  'locate',
  'info',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

// Path data only, so the same drawing renders as SVG and as a Path2D on the map canvas.
export type IconDrawing = {
  paths: readonly string[];
  strokeWidth: number;
  isFilled: boolean;
};

const STROKE_WIDTH = 2;
const BOLD_STROKE_WIDTH = 2.2;

// The design board draws with circle and rect; Path2D only takes path data.
function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

function roundedRect(x: number, y: number, size: { width: number; height: number; r: number }) {
  const { width, height, r } = size;
  const corner = (dx: number, dy: number) => `a${r} ${r} 0 0 1 ${dx} ${dy}`;
  return [
    `M${x + r} ${y}h${width - 2 * r}${corner(r, r)}`,
    `v${height - 2 * r}${corner(-r, r)}`,
    `h${2 * r - width}${corner(-r, -r)}`,
    `v${2 * r - height}${corner(r, -r)}z`,
  ].join('');
}

function outline(...paths: string[]): IconDrawing {
  return { paths, strokeWidth: STROKE_WIDTH, isFilled: false };
}

function boldOutline(...paths: string[]): IconDrawing {
  return { paths, strokeWidth: BOLD_STROKE_WIDTH, isFilled: false };
}

const STAR = 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z';

export const ICON_DRAWINGS = {
  bike: outline(
    circle(5.5, 17, 3.5),
    circle(18.5, 17, 3.5),
    'M5.5 17 9 9h6l3.5 8M9 9l3 8M14 5h2.5l-1.5 4',
  ),
  bus: outline(roundedRect(4, 3, { width: 16, height: 15, r: 3 }), 'M4 11h16M8 18v2M16 18v2'),
  dock: outline(
    roundedRect(4, 3, { width: 16, height: 18, r: 3 }),
    'M10 16V8h3a2.5 2.5 0 0 1 0 5h-3',
  ),
  search: outline(circle(11, 11, 7), 'm20 20-3.5-3.5'),
  close: boldOutline('M6 6l12 12M18 6 6 18'),
  star: outline(STAR),
  'star-filled': { ...outline(STAR), isFilled: true },
  'chevron-down': boldOutline('m6 9 6 6 6-6'),
  'chevron-up': boldOutline('m6 15 6-6 6 6'),
  'chevron-left': boldOutline('m15 18-6-6 6-6'),
  pin: outline('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', circle(12, 9.5, 2.5)),
  clock: outline(circle(12, 12, 9), 'M12 7v5l3 2'),
  'wifi-off': outline(
    'M2 2l20 20',
    'M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.3-1.6M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8A15 15 0 0 0 11 5',
    circle(12, 20, 0.6),
  ),
  'cloud-alert': outline(
    'M18 10a6 6 0 0 0-11.6-2A4.5 4.5 0 0 0 7 17h10a3.5 3.5 0 0 0 1-6.9',
    'M12 10v3M12 15.5v.5',
  ),
  warning: outline(
    'M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    'M12 9v4M12 17v.5',
  ),
  refresh: outline('M21 12a9 9 0 1 1-2.6-6.4L21 8', 'M21 3v5h-5'),
  plus: boldOutline('M12 5v14M5 12h14'),
  minus: boldOutline('M5 12h14'),
  locate: boldOutline(circle(12, 12, 4), 'M12 2v3M12 19v3M2 12h3M19 12h3'),
  info: outline(circle(12, 12, 9), 'M12 11v5M12 8v.5'),
} as const satisfies Record<IconName, IconDrawing>;
