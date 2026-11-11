import { render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { Legend } from '.';

type LegendProps = ComponentProps<typeof Legend>;
type LegendItem = LegendProps['items'][number];

const AVAILABILITY: LegendItem[] = [
  { tone: 'success', text: '5 o más' },
  { tone: 'warning', text: '1 a 4' },
  { tone: 'danger', text: 'Vacía' },
  { tone: 'neutral', text: 'Fuera de servicio' },
  { tone: 'muted', text: 'Sin confirmar' },
];

const STOPS: LegendItem[] = [
  { tone: 'neutral', text: 'Parada', shape: 'square' },
  { tone: 'info', text: 'Parada elegida', shape: 'square' },
];

function renderLegend(props: Partial<LegendProps> = {}) {
  const { container } = render(<Legend label="Leyenda del mapa" items={AVAILABILITY} {...props} />);
  return { list: screen.getByRole('list', { name: props.label ?? 'Leyenda del mapa' }), container };
}

function swatchOf(text: string) {
  return screen.getByText(text).firstElementChild;
}

describe('Legend', () => {
  it('requires its label and the text of each item', () => {
    expectTypeOf<Pick<LegendProps, 'label'>>().toEqualTypeOf<{ label: string }>();
    expectTypeOf<Pick<LegendItem, 'text' | 'tone'>>().toEqualTypeOf<{
      text: string;
      tone: 'success' | 'warning' | 'danger' | 'neutral' | 'muted' | 'info' | 'inverse';
    }>();
  });

  it.each([
    ['availability', 'Leyenda del mapa', AVAILABILITY],
    ['stops', 'Leyenda de paradas', STOPS],
  ])('is a named list with one item per swatch for %s', (_domain, label, items) => {
    const { list } = renderLegend({ label, items });
    const entries = within(list).getAllByRole('listitem');

    expect(list.tagName).toBe('UL');
    expect(entries.map((entry) => entry.textContent)).toEqual(items.map(({ text }) => text));
  });

  it('hides every swatch from screen readers', () => {
    const { list } = renderLegend();

    for (const entry of within(list).getAllByRole('listitem')) {
      expect(entry.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it.each([
    ['success', 'bg-tone-success'],
    ['warning', 'bg-tone-warning'],
    ['neutral', 'bg-tone-neutral'],
    ['info', 'bg-tone-info'],
    ['inverse', 'bg-tone-inverse'],
  ] as const)('fills the %s swatch', (tone, fill) => {
    renderLegend({ items: [{ tone, text: tone }] });

    expect(swatchOf(tone)).toHaveClass(fill, 'size-3.5', 'rounded-full');
    expect(swatchOf(tone)).not.toHaveClass('border-2');
  });

  it.each([
    ['danger', ['bg-surface', 'border-2', 'border-tone-danger-line']],
    ['muted', ['bg-tone-muted', 'border-2', 'border-tone-muted-line']],
  ] as const)('rings the %s swatch, 14 px in all', (tone, classes) => {
    renderLegend({ items: [{ tone, text: tone }] });

    expect(swatchOf(tone)).toHaveClass(...classes, 'size-3.5', 'box-border');
  });

  it('draws danger dashed by default, like the badge and the tile', () => {
    renderLegend();

    expect(swatchOf('Vacía')).toHaveClass('border-dashed');
    expect(swatchOf('Sin confirmar')).toHaveClass('border-solid');
  });

  it('draws danger solid with lineStyle="solid", like the map point', () => {
    renderLegend({ items: [{ tone: 'danger', text: 'Vacía', lineStyle: 'solid' }] });

    expect(swatchOf('Vacía')).toHaveClass('border-solid');
    expect(swatchOf('Vacía')).not.toHaveClass('border-dashed');
  });

  it('can draw a square swatch', () => {
    renderLegend({ label: 'Leyenda de paradas', items: STOPS });

    expect(swatchOf('Parada')).toHaveClass('rounded', 'bg-tone-neutral');
    expect(swatchOf('Parada')).not.toHaveClass('rounded-full');
  });

  it('sets the text at 13 px with the swatch 6 px away', () => {
    const { list } = renderLegend();

    expect(list).toHaveClass('text-meta', 'text-tone-neutral-soft-foreground');
    expect(within(list).getAllByRole('listitem')[0]).toHaveClass('flex', 'items-center', 'gap-1.5');
  });

  it.each([
    ['inline', ['flex-row', 'flex-wrap']],
    ['stacked', ['flex-col']],
  ] as const)('lays out %s', (layout, classes) => {
    expect(renderLegend({ layout }).list).toHaveClass('flex', 'gap-x-3.5', 'gap-y-2.5', ...classes);
  });

  it('is inline by default', () => {
    expect(renderLegend().list).toHaveClass('flex-row', 'flex-wrap');
  });

  it('is no live region', () => {
    const { container } = renderLegend();

    expect(container.querySelector('output, [aria-live]')).toBeNull();
  });

  it.each([
    ['inline availability', {}],
    ['stacked', { layout: 'stacked' }],
    ['stops', { label: 'Leyenda de paradas', items: STOPS }],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = renderLegend(props);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
