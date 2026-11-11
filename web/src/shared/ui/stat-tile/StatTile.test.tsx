import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { StatTile } from '.';

type StatTileProps = ComponentProps<typeof StatTile>;

const BIKES = { value: '3', label: 'bicis disponibles', tone: 'warning' } as const;
const NEXT_BUS = { value: '4', label: 'minutos para el 27', tone: 'info' } as const;

function renderTile(props: Partial<StatTileProps> = {}) {
  const { container } = render(<StatTile {...BIKES} {...props} />);
  return { tile: container.firstElementChild as HTMLElement, container };
}

describe('StatTile', () => {
  it('requires its value, label and tone', () => {
    expectTypeOf<Pick<StatTileProps, 'value' | 'label' | 'tone'>>().toEqualTypeOf<{
      value: string;
      label: string;
      tone: 'success' | 'warning' | 'danger' | 'neutral' | 'muted' | 'info';
    }>();
  });

  it.each([
    ['bikes', BIKES],
    ['buses', NEXT_BUS],
  ])('reads the value before the label for %s', (_domain, props) => {
    const { tile } = renderTile(props);

    expect(tile).toHaveTextContent(`${props.value}${props.label}`);
    expect(screen.getByText(props.value)).toHaveClass('text-stat', 'tabular-nums');
    expect(screen.getByText(props.label)).toHaveClass('text-meta', 'text-fg');
  });

  it.each([
    ['success', ['bg-tone-success-soft', 'border-tone-success-line'], 'text-tone-success-label'],
    [
      'warning',
      ['bg-tone-warning-soft', 'border-tone-warning-line'],
      'text-tone-warning-foreground',
    ],
    ['danger', ['bg-surface', 'border-tone-danger-line'], 'text-tone-danger-label'],
    [
      'neutral',
      ['bg-tone-neutral-soft', 'border-tone-neutral-soft'],
      'text-tone-neutral-soft-foreground',
    ],
    ['muted', ['bg-tone-muted', 'border-tone-muted-line'], 'text-tone-muted-foreground'],
    ['info', ['bg-tone-info-soft', 'border-tone-info-line'], 'text-tone-info-label'],
  ] as const)('draws %s with its fill, border and value color', (tone, box, value) => {
    const { tile } = renderTile({ tone });

    expect(tile).toHaveClass(...box, 'border-2');
    expect(screen.getByText(BIKES.value)).toHaveClass(value);
  });

  it('draws danger with a dashed border, like the badge', () => {
    expect(renderTile({ tone: 'danger', value: '0' }).tile).toHaveClass('border-dashed');
  });

  it.each(['success', 'warning', 'neutral', 'muted', 'info'] as const)(
    'draws %s with a solid border',
    (tone) => {
      expect(renderTile({ tone }).tile).toHaveClass('border-solid');
    },
  );

  it('is a centered column in a control box', () => {
    expect(renderTile().tile).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'gap-0.5',
      'text-center',
      'rounded-control',
      'box-border',
      'px-3',
      'py-2.5',
    );
  });

  describe('statusLabel', () => {
    it('draws the word under the label in the tone label color', () => {
      const { tile } = renderTile({ tone: 'muted', statusLabel: 'Sin confirmar' });
      const status = screen.getByText('Sin confirmar');

      expect(status).toHaveClass('text-caption', 'font-bold', 'text-tone-muted-label');
      expect(tile).toHaveTextContent(`${BIKES.value}${BIKES.label}Sin confirmar`);
    });

    it('is not drawn unless given', () => {
      expect(renderTile().tile.children).toHaveLength(2);
    });
  });

  describe('srText', () => {
    it('reads the phrase and hides what is drawn', () => {
      const srText = '3 bicis disponibles, sin confirmar';
      renderTile({ tone: 'muted', statusLabel: 'Sin confirmar', srText });

      expect(screen.getByText(srText)).toHaveClass('sr-only');
      for (const text of [BIKES.value, BIKES.label, 'Sin confirmar']) {
        expect(screen.getByText(text)).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('leaves what is drawn readable without it', () => {
      const { tile } = renderTile();

      expect(tile.querySelector('[aria-hidden]')).toBeNull();
    });
  });

  describe('loading', () => {
    it('is a chip box with no value', () => {
      const { tile } = renderTile({ loading: true });

      expect(tile).toHaveClass('bg-chip', 'rounded-control', 'h-19');
      expect(tile).toBeEmptyDOMElement();
      expect(tile).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('is no live region', () => {
    const { container } = renderTile({ srText: '3 bicis disponibles' });

    expect(container.querySelector('output, [role], [aria-live]')).toBeNull();
  });

  it.each([
    ['success', { tone: 'success', value: '12', label: 'anclajes libres' }],
    ['danger', { tone: 'danger', value: '0' }],
    ['neutral', { tone: 'neutral', value: '–' }],
    ['muted with statusLabel', { tone: 'muted', statusLabel: 'Sin confirmar' }],
    ['info with srText', { ...NEXT_BUS, srText: 'El 27 llega en 4 minutos' }],
    ['loading', { loading: true }],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = renderTile(props);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
