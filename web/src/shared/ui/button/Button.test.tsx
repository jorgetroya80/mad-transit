import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { Button } from '.';

type ButtonProps = ComponentProps<typeof Button>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type ButtonOptions = DistributiveOmit<ButtonProps, 'label' | 'onClick'> & { label?: string };

function renderButton(props: ButtonOptions = {}) {
  const onClick = vi.fn<() => void>();
  const { container } = render(<Button label="Reintentar" onClick={onClick} {...props} />);
  return { button: screen.getByRole('button', { name: 'Reintentar' }), onClick, container };
}

function iconPathOf(button: HTMLElement) {
  return button.querySelector('svg path')?.getAttribute('d');
}

describe('Button', () => {
  it('requires a label, its visible text and accessible name', () => {
    expectTypeOf<Pick<ButtonProps, 'label'>>().toEqualTypeOf<{ label: string }>();
  });

  it.each(['Reintentar', 'Ver horarios'])('shows «%s» as its text and name', (label) => {
    render(<Button label={label} onClick={() => {}} />);

    expect(screen.getByRole('button', { name: label })).toHaveTextContent(label);
  });

  it('is a medium primary button of type button by default', () => {
    const { button } = renderButton();

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('h-11', 'px-4', 'rounded-control', 'text-body', 'font-semibold');
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'border-primary');
  });

  it('can submit a form', () => {
    expect(renderButton({ type: 'submit' }).button).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when pressed', async () => {
    const { button, onClick } = renderButton();

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each([
    ['primary', ['bg-primary', 'text-primary-foreground', 'border-primary']],
    ['secondary', ['bg-surface', 'text-primary', 'border-primary']],
  ] as const)('draws %s with its colors', (variant, classes) => {
    expect(renderButton({ variant }).button).toHaveClass(...classes);
  });

  it.each([
    ['warning', ['bg-surface', 'text-tone-warning-soft-foreground', 'border-tone-warning-icon']],
    ['danger', ['bg-surface', 'text-tone-danger-soft-foreground', 'border-tone-danger-icon']],
  ] as const)('draws outline %s with its tone on border and text', (tone, classes) => {
    expect(renderButton({ variant: 'outline', tone }).button).toHaveClass(...classes);
  });

  it.each([
    ['primary', {}, ['hover:bg-primary-hover', 'active:bg-primary-hover']],
    [
      'secondary',
      { variant: 'secondary' },
      ['hover:bg-primary-soft', 'active:bg-primary-soft-border'],
    ],
    [
      'outline warning',
      { variant: 'outline', tone: 'warning' },
      ['hover:bg-tone-warning-soft', 'active:bg-tone-warning-soft'],
    ],
    [
      'outline danger',
      { variant: 'outline', tone: 'danger' },
      ['hover:bg-tone-danger-soft', 'active:bg-tone-danger-soft'],
    ],
  ] as const)('%s changes its fill on hover and press', (_name, props, classes) => {
    expect(renderButton(props).button).toHaveClass(...classes);
  });

  it.each([
    ['sm', ['h-10', 'px-3', 'rounded-chip', 'text-meta', 'font-semibold']],
    ['md', ['h-11', 'px-4', 'rounded-control', 'text-body', 'font-semibold']],
    ['lg', ['h-12', 'px-6', 'rounded-card', 'text-label']],
  ] as const)('is %s high with its padding, radius and text', (size, classes) => {
    expect(renderButton({ size }).button).toHaveClass(...classes);
  });

  it('enlarges the small hit area to 44 px without changing the drawing', () => {
    const { button } = renderButton({ size: 'sm' });

    expect(button).toHaveClass(
      'relative',
      'after:absolute',
      'after:inset-x-0',
      'after:-inset-y-0.5',
    );
  });

  it.each(['md', 'lg'] as const)('needs no larger hit area at %s', (size) => {
    expect(renderButton({ size }).button).not.toHaveClass('after:absolute');
  });

  it('shows a leading 18 px icon before the text', () => {
    const { button } = renderButton({ icon: 'refresh' });
    const svg = button.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '18');
    expect(iconPathOf(button)).toBe(ICON_DRAWINGS.refresh.paths[0]);
    expect(button.firstElementChild).toBe(svg);
  });

  it('has no icon unless one is given', () => {
    expect(renderButton().button.querySelector('svg')).toBeNull();
  });

  it('focuses with the library ring', () => {
    expect(renderButton().button).toHaveClass('focus-ring');
  });

  describe('disabled', () => {
    it.each([
      ['primary', {}],
      ['secondary', { variant: 'secondary' }],
      ['outline', { variant: 'outline', tone: 'warning' }],
    ] as const)('%s turns grey with the native attribute and no hover', (_name, props) => {
      const { button } = renderButton({ ...props, disabled: true });

      expect(button).toBeDisabled();
      expect(button).toHaveClass('bg-surface-disabled', 'text-fg-muted', 'border-line-strong');
      expect(button.className).not.toMatch(/hover:|active:/);
    });

    it('cannot be pressed', async () => {
      const { button, onClick } = renderButton({ disabled: true });

      await userEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('passes axe', async () => {
      const { container } = renderButton({ disabled: true, icon: 'refresh' });

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('busy', () => {
    it('stays focusable: aria-disabled and aria-busy, not disabled', () => {
      const { button } = renderButton({ busy: true });

      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeEnabled();
      button.focus();
      expect(button).toHaveFocus();
    });

    it('swaps the icon for an 18 px spinner and keeps the text', () => {
      const { button } = renderButton({ busy: true, icon: 'refresh' });
      const svgs = button.querySelectorAll('svg');

      expect(svgs).toHaveLength(1);
      expect(svgs[0]).toHaveClass('animate-spin');
      expect(svgs[0]).toHaveAttribute('width', '18');
      expect(button).toHaveTextContent('Reintentar');
    });

    it('shows the spinner even without an icon', () => {
      expect(renderButton({ busy: true }).button.querySelector('.animate-spin')).not.toBeNull();
    });

    it('keeps its colors and drops hover and press', () => {
      const { button } = renderButton({ busy: true });

      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
      expect(button.className).not.toMatch(/hover:|active:/);
    });

    it('draws the spinner arc in primary on an outline button', () => {
      const { button } = renderButton({ busy: true, variant: 'outline', tone: 'warning' });

      expect(button.querySelector('svg')).toHaveClass('text-primary');
    });

    it('ignores presses, also as a submit button', async () => {
      const onClick = vi.fn<() => void>();
      const onSubmit = vi.fn<() => void>();
      render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Button label="Buscar" onClick={onClick} busy type="submit" />
        </form>,
      );

      await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

      expect(onClick).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('passes axe', async () => {
      const { container } = renderButton({ busy: true, icon: 'refresh' });

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  it.each([
    ['primary', {}],
    ['secondary', { variant: 'secondary', label: 'Ver horarios' }],
    ['outline warning', { variant: 'outline', tone: 'warning' }],
    ['outline danger', { variant: 'outline', tone: 'danger' }],
    ['small', { size: 'sm', label: 'Activar' }],
    ['large with icon', { size: 'lg', icon: 'refresh' }],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = render(<Button label="Reintentar" onClick={() => {}} {...props} />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
