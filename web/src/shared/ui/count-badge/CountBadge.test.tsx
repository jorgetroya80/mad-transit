import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { CountBadge } from '.';

type CountBadgeProps = ComponentProps<typeof CountBadge>;

function renderBadge(props: Partial<CountBadgeProps> = {}) {
  const { container } = render(<CountBadge value="3" tone="warning" {...props} />);
  return { badge: container.firstElementChild as HTMLElement, container };
}

describe('CountBadge', () => {
  it('requires its value and tone', () => {
    expectTypeOf<Pick<CountBadgeProps, 'value' | 'tone'>>().toEqualTypeOf<{
      value: string;
      tone: 'success' | 'warning' | 'danger' | 'neutral' | 'muted' | 'info';
    }>();
  });

  it.each(['3', '12', '–'])('shows «%s» as given', (value) => {
    renderBadge({ value });

    expect(screen.getByText(value)).toBeInTheDocument();
  });

  it.each([
    ['success', ['bg-tone-success', 'text-tone-success-foreground', 'border-tone-success']],
    ['warning', ['bg-tone-warning', 'text-tone-warning-foreground', 'border-tone-warning']],
    ['danger', ['bg-surface', 'text-tone-danger-foreground', 'border-tone-danger-line']],
    ['neutral', ['bg-tone-neutral', 'text-tone-neutral-foreground', 'border-tone-neutral']],
    ['muted', ['bg-tone-muted', 'text-tone-muted-foreground', 'border-tone-muted-line']],
    ['info', ['bg-tone-info', 'text-tone-info-foreground', 'border-tone-info']],
  ] as const)('draws %s with its fill, figure and border', (tone, classes) => {
    expect(renderBadge({ tone }).badge).toHaveClass(...classes, 'border-2');
  });

  it('draws danger with a dashed border, so an empty count is not told by color alone', () => {
    expect(renderBadge({ tone: 'danger', value: '0' }).badge).toHaveClass('border-dashed');
  });

  it.each(['success', 'warning', 'neutral', 'muted', 'info'] as const)(
    'draws %s with a solid border',
    (tone) => {
      expect(renderBadge({ tone }).badge).toHaveClass('border-solid');
    },
  );

  it('is a pill whose border does not change its size, with tabular figures', () => {
    expect(renderBadge().badge).toHaveClass(
      'rounded-full',
      'box-border',
      'px-2',
      'font-bold',
      'tabular-nums',
    );
  });

  it.each([
    ['md', ['h-8', 'min-w-11', 'text-base']],
    ['sm', ['h-7.5', 'min-w-10', 'text-label']],
  ] as const)('sets the %s size', (size, classes) => {
    expect(renderBadge({ size }).badge).toHaveClass(...classes);
  });

  it('is md by default', () => {
    expect(renderBadge().badge).toHaveClass('h-8', 'min-w-11');
  });

  describe('srText', () => {
    it('hides the whole badge without it, since the row already says it', () => {
      expect(renderBadge().badge).toHaveAttribute('aria-hidden', 'true');
    });

    it.each([
      ['notices', '2', '2 avisos sin leer'],
      ['bikes', '3', '3 bicis disponibles'],
    ])('reads the phrase about %s and hides the figure', (_domain, value, srText) => {
      const { badge } = renderBadge({ value, tone: 'info', srText });

      expect(badge).not.toHaveAttribute('aria-hidden');
      expect(screen.getByText(value)).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByText(srText)).toHaveClass('sr-only');
    });
  });

  describe('loading', () => {
    it('is a grey chip with no figure', () => {
      const { badge } = renderBadge({ loading: true });

      expect(badge).toHaveClass('bg-chip', 'rounded-full', 'h-8', 'min-w-11');
      expect(badge).toBeEmptyDOMElement();
      expect(badge).toHaveAttribute('aria-hidden', 'true');
    });

    it('keeps the small size', () => {
      expect(renderBadge({ loading: true, size: 'sm' }).badge).toHaveClass('h-7.5', 'min-w-10');
    });

    it('drops the tone and the phrase', () => {
      const { badge } = renderBadge({ loading: true, tone: 'info', srText: '2 avisos sin leer' });

      expect(badge).not.toHaveClass('bg-tone-info');
      expect(screen.queryByText('2 avisos sin leer')).toBeNull();
    });
  });

  it('is no live region', () => {
    const { container } = renderBadge({ srText: '3 bicis disponibles' });

    expect(container.querySelector('output, [role], [aria-live]')).toBeNull();
  });

  it.each([
    ['success', { tone: 'success', value: '12' }],
    ['danger', { tone: 'danger', value: '0' }],
    ['muted small', { tone: 'muted', size: 'sm' }],
    ['info with srText', { tone: 'info', value: '2', srText: '2 avisos sin leer' }],
    ['loading', { loading: true }],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = renderBadge(props);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
