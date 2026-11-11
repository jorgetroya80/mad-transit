import { render } from '@testing-library/react';
import { ICON_DRAWINGS, ICON_NAMES, ICON_SIZES, Icon, type IconName } from '.';

const BOLD_STROKE_ICONS: IconName[] = [
  'close',
  'chevron-down',
  'chevron-up',
  'chevron-left',
  'locate',
  'plus',
  'minus',
];

// Arguments each SVG path command takes; a command may repeat its arguments.
const COMMAND_ARITY: Record<string, number> = {
  m: 2,
  l: 2,
  h: 1,
  v: 1,
  c: 6,
  s: 4,
  q: 4,
  t: 2,
  a: 7,
  z: 0,
};
const PATH_TOKEN = /[MmLlHhVvCcSsQqTtAaZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|\S/g;
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/;

type PathCommand = { command: string; argumentCount: number };

function parsePath(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  for (const token of d.match(PATH_TOKEN) ?? []) {
    const current = commands.at(-1);
    if (NUMBER.test(token) && current) current.argumentCount += 1;
    else commands.push({ command: token, argumentCount: 0 });
  }
  return commands;
}

// jsdom has no Path2D, so the syntax Path2D accepts is checked here: a moveto first, known
// commands only, and each command with a whole number of argument sets.
function isValidPath(d: string): boolean {
  const commands = parsePath(d);
  if (commands[0]?.command.toLowerCase() !== 'm') return false;
  return commands.every(({ command, argumentCount }) => {
    const arity = COMMAND_ARITY[command.toLowerCase()];
    if (arity === undefined) return false;
    if (arity === 0) return argumentCount === 0;
    return argumentCount > 0 && argumentCount % arity === 0;
  });
}

function renderIcon(name: IconName, size?: (typeof ICON_SIZES)[number]) {
  const { container } = render(<Icon name={name} size={size} />);
  const svg = container.querySelector('svg');
  if (!svg) throw new Error(`Icon ${name} rendered no svg`);
  return svg;
}

describe('Icon', () => {
  it('has the 20 names the screens use, without arrow-left', () => {
    expect(ICON_NAMES).toHaveLength(20);
    expectTypeOf<'arrow-left'>().not.toExtend<IconName>();
  });

  it.each(ICON_NAMES)('draws %s hidden from assistive technology', (name) => {
    const svg = renderIcon(name);

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('stroke-linejoin', 'round');
  });

  it.each(ICON_NAMES)('draws every stroke of %s from its data', (name) => {
    const drawn = [...renderIcon(name).querySelectorAll('path')].map((path) =>
      path.getAttribute('d'),
    );

    expect(drawn).toEqual(ICON_DRAWINGS[name].paths);
  });

  it.each(ICON_NAMES)('stores %s as path data that Path2D accepts', (name) => {
    const invalidPaths = ICON_DRAWINGS[name].paths.filter((d) => !isValidPath(d));

    expect(invalidPaths).toEqual([]);
  });

  it.each(ICON_NAMES)('draws %s with the stroke width of the design', (name) => {
    const width = BOLD_STROKE_ICONS.includes(name) ? '2.2' : '2';

    expect(renderIcon(name)).toHaveAttribute('stroke-width', width);
  });

  it('fills star-filled only', () => {
    const filled = ICON_NAMES.filter((name) => renderIcon(name).getAttribute('fill') !== 'none');

    expect(filled).toEqual(['star-filled']);
    expect(renderIcon('star-filled')).toHaveAttribute('fill', 'currentColor');
  });

  it('is 20 px by default', () => {
    const svg = renderIcon('bus');

    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it.each(ICON_SIZES)('can be %i px', (size) => {
    const svg = renderIcon('bike', size);

    expect(svg).toHaveAttribute('width', String(size));
    expect(svg).toHaveAttribute('height', String(size));
  });

  it('adds the classes it receives', () => {
    const { container } = render(<Icon name="info" className="text-tone-info-icon" />);

    expect(container.querySelector('svg')).toHaveClass('text-tone-info-icon');
  });

  it('rejects path data that Path2D would not accept', () => {
    expect(isValidPath('L2 2')).toBe(false);
    expect(isValidPath('M2 2 x4')).toBe(false);
    expect(isValidPath('M2 2a1 1 0 0 1')).toBe(false);
    expect(isValidPath('M2 2z3')).toBe(false);
  });
});
