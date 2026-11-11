import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { StatusText } from '.';

type StatusTextProps = ComponentProps<typeof StatusText>;

const UPDATED = 'Actualizado hace 30 s';

function renderStatus(props: Partial<StatusTextProps> = {}) {
  const { container } = render(<StatusText text={UPDATED} tone="success" {...props} />);
  return { root: container.firstElementChild as HTMLElement, container };
}

function dotOf(root: HTMLElement) {
  return root.querySelector('[aria-hidden="true"]');
}

describe('StatusText', () => {
  it('requires its text and tone', () => {
    expectTypeOf<Pick<StatusTextProps, 'text' | 'tone'>>().toEqualTypeOf<{
      text: string;
      tone: 'success' | 'warning' | 'danger' | 'neutral';
    }>();
  });

  it.each([UPDATED, 'Llegadas no disponibles'])('shows «%s»', (text) => {
    renderStatus({ text });

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([
    ['success', 'bg-tone-success', ['text-fg-muted', 'font-normal']],
    ['warning', 'bg-tone-warning-dot', ['text-tone-warning-label', 'font-semibold']],
    ['danger', 'bg-tone-danger-line', ['text-tone-danger-label', 'font-semibold']],
    ['neutral', 'bg-handle', ['text-fg-muted', 'font-semibold']],
  ] as const)('colors the %s dot and text', (tone, dotClass, textClasses) => {
    const { root } = renderStatus({ tone });

    expect(root).toHaveClass(...textClasses);
    expect(dotOf(root)).toHaveClass('size-2', 'rounded-full', dotClass);
  });

  it('hides the decorative dot from screen readers', () => {
    const { root } = renderStatus();

    expect(dotOf(root)).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveTextContent(UPDATED);
  });

  it('can go without the dot', () => {
    expect(dotOf(renderStatus({ showDot: false }).root)).toBeNull();
  });

  it.each([
    ['md', 'text-body'],
    ['sm', 'text-caption'],
  ] as const)('sets the %s text', (size, textClass) => {
    expect(renderStatus({ size }).root).toHaveClass(textClass, 'gap-1.5');
  });

  it('is md by default', () => {
    expect(renderStatus().root).toHaveClass('text-body');
  });

  describe('live', () => {
    it('is no live region by default', () => {
      const { root } = renderStatus();

      expect(root.tagName).toBe('SPAN');
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('is an <output> when polite', () => {
      renderStatus({ live: 'polite', tone: 'danger', text: 'Llegadas no disponibles' });
      const region = screen.getByRole('status');

      expect(region.tagName).toBe('OUTPUT');
      expect(region).toHaveTextContent('Llegadas no disponibles');
    });
  });

  it.each([
    ['success', {}],
    ['warning', { tone: 'warning', text: 'Datos de hace 12 min' }],
    ['danger', { tone: 'danger', text: 'Sin datos del servicio' }],
    ['neutral small without dot', { tone: 'neutral', size: 'sm', showDot: false }],
    ['polite', { live: 'polite' }],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = renderStatus(props);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
