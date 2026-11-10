import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { IconButton } from '.';

type IconButtonProps = ComponentProps<typeof IconButton>;

const CLOSE = { label: 'Cerrar la ficha de la estación', icon: 'close' } as const;
const FAVORITE = { label: 'Favorita', icon: 'star', pressedIcon: 'star-filled' } as const;
const SHOW_ON_MAP = {
  label: 'Ver en el mapa el autobús de la línea 27',
  icon: 'pin',
  iconTone: 'primary',
  variant: 'outline',
} as const;

function renderIconButton(props: Partial<IconButtonProps> = {}) {
  const onClick = vi.fn<() => void>();
  const allProps = { ...CLOSE, onClick, ...props };
  const { container } = render(<IconButton {...allProps} />);
  return { button: screen.getByRole('button', { name: allProps.label }), onClick, container };
}

function svgOf(button: HTMLElement) {
  const svg = button.querySelector('svg');
  if (!svg) throw new Error('IconButton rendered no svg');
  return svg;
}

function iconPathOf(button: HTMLElement) {
  return svgOf(button).querySelector('path')?.getAttribute('d');
}

describe('IconButton', () => {
  it('requires a label, its accessible name', () => {
    expectTypeOf<Pick<IconButtonProps, 'label'>>().toEqualTypeOf<{ label: string }>();
  });

  it.each([CLOSE, SHOW_ON_MAP])('is named «$label» by aria-label', (props) => {
    const { button } = renderIconButton(props);

    expect(button).toHaveAttribute('aria-label', props.label);
    expect(button).toHaveAttribute('type', 'button');
  });

  it('shows its icon at 20 px, decorative', () => {
    const svg = svgOf(renderIconButton().button);

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg.querySelector('path')).toHaveAttribute('d', ICON_DRAWINGS.close.paths[0]);
  });

  it.each(['star', 'star-filled'] as const)('draws the %s icon at 24 px', (icon) => {
    expect(svgOf(renderIconButton({ ...FAVORITE, icon }).button)).toHaveAttribute('width', '24');
  });

  it('draws its icon at the size it is given', () => {
    expect(svgOf(renderIconButton({ iconSize: 18 }).button)).toHaveAttribute('width', '18');
  });

  it('calls onClick when pressed with Enter or Space', async () => {
    const { button, onClick } = renderIconButton();

    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('focuses with the library ring', () => {
    expect(renderIconButton().button).toHaveClass('focus-ring');
  });

  it.each([
    ['ghost', {}, ['bg-transparent']],
    ['outline', { variant: 'outline' }, ['bg-surface', 'border', 'border-line-subtle']],
    ['floating md', { variant: 'floating' }, ['bg-surface', 'shadow-control']],
    ['floating lg', { variant: 'floating', size: 'lg' }, ['bg-surface', 'shadow-pill']],
  ] as const)('draws %s with its surface', (_name, props, classes) => {
    expect(renderIconButton(props).button).toHaveClass(...classes);
  });

  it.each(['ghost', 'outline', 'floating'] as const)(
    '%s turns chip on hover and line when pressed',
    (variant) => {
      expect(renderIconButton({ variant }).button).toHaveClass('hover:bg-chip', 'active:bg-line');
    },
  );

  it.each([
    ['sm', ['size-10', 'rounded-control', 'after:-inset-0.5']],
    ['md', ['size-11', 'rounded-control']],
    ['lg', ['size-12', 'rounded-full']],
  ] as const)('is %s with its size and radius', (size, classes) => {
    expect(renderIconButton({ size }).button).toHaveClass(...classes);
  });

  it.each([
    ['neutral', 'text-fg-muted'],
    ['primary', 'text-primary'],
  ] as const)('paints a %s icon in %s', (iconTone, colorClass) => {
    expect(renderIconButton({ iconTone }).button).toHaveClass(colorClass);
  });

  it('is neutral by default', () => {
    expect(renderIconButton().button).toHaveClass('text-fg-muted');
  });

  describe('toggle', () => {
    it('is no toggle without pressed', () => {
      expect(renderIconButton().button).not.toHaveAttribute('aria-pressed');
    });

    it('off: aria-pressed false and the normal icon', () => {
      const { button } = renderIconButton({ ...FAVORITE, pressed: false });

      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(iconPathOf(button)).toBe(ICON_DRAWINGS.star.paths[0]);
      expect(svgOf(button)).toHaveAttribute('fill', 'none');
    });

    it('on: keeps its label, aria-pressed true and the pressed icon in primary', () => {
      const { button } = renderIconButton({ ...FAVORITE, pressed: true });

      expect(button).toHaveAccessibleName('Favorita');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(svgOf(button)).toHaveAttribute('fill', 'currentColor');
      expect(button).toHaveClass('text-primary');
    });

    it('on: keeps its background like normal', () => {
      const { button } = renderIconButton({ ...SHOW_ON_MAP, pressed: true });

      expect(button).toHaveClass('bg-surface', 'border-line-subtle');
    });

    it('reuses the icon when no pressed icon is given', () => {
      const { button } = renderIconButton({ ...SHOW_ON_MAP, pressed: true });

      expect(iconPathOf(button)).toBe(ICON_DRAWINGS.pin.paths[0]);
    });

    it.each([true, false])('passes axe with pressed %s', async (pressed) => {
      const { container } = renderIconButton({ ...FAVORITE, pressed });

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('tooltip', () => {
    it.each([
      [false, 'Añadir a favoritas'],
      [true, 'Quitar de favoritas'],
    ])('pressed %s: sets only the title «%s»', (pressed, tooltip) => {
      const { button } = renderIconButton({ ...FAVORITE, pressed, tooltip });

      expect(button).toHaveAttribute('title', tooltip);
      expect(button).toHaveAccessibleName('Favorita');
    });

    it('has no title without a tooltip', () => {
      expect(renderIconButton().button).not.toHaveAttribute('title');
    });

    it('passes axe', async () => {
      const { container } = renderIconButton({ ...FAVORITE, tooltip: 'Añadir a favoritas' });

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('disabled', () => {
    it.each([
      ['ghost', {}, 'bg-transparent'],
      ['outline', { variant: 'outline' }, 'bg-surface-disabled'],
      ['floating', { variant: 'floating' }, 'bg-surface-disabled'],
    ] as const)('%s: native disabled, handle icon and no hover', (_name, props, background) => {
      const { button } = renderIconButton({ ...props, disabled: true });

      expect(button).toBeDisabled();
      expect(button).toHaveClass(background, 'text-handle');
      expect(button.className).not.toMatch(/hover:|active:/);
    });

    it('cannot be pressed', async () => {
      const { button, onClick } = renderIconButton({ disabled: true });

      await userEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('passes axe', async () => {
      const { container } = renderIconButton({ disabled: true });

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('busy', () => {
    it('stays focusable: aria-disabled and aria-busy, not disabled', () => {
      const { button } = renderIconButton({ busy: true });

      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeEnabled();
      button.focus();
      expect(button).toHaveFocus();
    });

    it('swaps the icon for a 20 px primary spinner', () => {
      const { button } = renderIconButton({ busy: true });
      const svgs = button.querySelectorAll('svg');

      expect(svgs).toHaveLength(1);
      expect(svgs[0]).toHaveClass('animate-spin', 'text-primary');
      expect(svgs[0]).toHaveAttribute('width', '20');
    });

    it('keeps its surface and drops hover and press', () => {
      const { button } = renderIconButton({ variant: 'outline', busy: true });

      expect(button).toHaveClass('bg-surface', 'border-line-subtle');
      expect(button.className).not.toMatch(/hover:|active:/);
    });

    it('ignores presses', async () => {
      const { button, onClick } = renderIconButton({ busy: true });

      await userEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('passes axe', async () => {
      const { container } = renderIconButton({ variant: 'floating', size: 'lg', busy: true });

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  it.each([
    ['ghost', CLOSE],
    ['outline', SHOW_ON_MAP],
    [
      'floating lg',
      { label: 'Centrar en mi posición', icon: 'locate', variant: 'floating', size: 'lg' },
    ],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = render(<IconButton {...props} onClick={() => {}} />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
