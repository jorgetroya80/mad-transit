import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { CountBadge } from '../count-badge';
import { IconButton } from '../icon-button';
import { Tag } from '../tag';
import { ListItem } from '.';

type ListItemProps = ComponentProps<typeof ListItem>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type SelectableOptions = DistributiveOmit<
  Extract<ListItemProps, { onSelect: () => void }>,
  'title' | 'onSelect' | 'accessibleLabel'
>;
type StaticOptions = DistributiveOmit<Extract<ListItemProps, { onSelect?: undefined }>, 'title'>;

const STATION = {
  leadingText: '33',
  title: 'Puerta del Sol',
  subtitle: '57 m · 1 min a pie',
  accessibleLabel: 'Estación 33, Puerta del Sol, 57 metros, 3 bicis',
} as const;

const STOP = {
  leadingText: '1211',
  title: 'Alcalá-Sevilla',
  accessibleLabel: 'Parada 1211, Alcalá-Sevilla, 140 metros, líneas 5, 15 y 20',
} as const;

const SPINNER_ARC = 'M12 3a9 9 0 0 1 9 9';

function renderRow(props: SelectableOptions = {}) {
  const onSelect = vi.fn<() => void>();
  const { container } = render(
    <ul>
      <li>
        <ListItem
          {...STATION}
          onSelect={onSelect}
          trailing={<CountBadge value="3" tone="warning" />}
          {...props}
        />
      </li>
    </ul>,
  );
  return {
    row: screen.getByRole('button', { name: STATION.accessibleLabel }),
    onSelect,
    container,
  };
}

function renderStaticRow(props: StaticOptions = {}) {
  const { container } = render(<ListItem title="ATOCHA" {...props} />);
  const row = container.firstElementChild;
  if (!(row instanceof HTMLElement)) throw new Error('ListItem rendered nothing');
  return { row, container };
}

function leadingBoxOf(row: HTMLElement) {
  return within(row).getByText(STATION.leadingText);
}

describe('ListItem', () => {
  describe('types', () => {
    it('always requires a title', () => {
      expectTypeOf<Pick<ListItemProps, 'title'>>().toEqualTypeOf<{ title: string }>();
      expectTypeOf<{ subtitle: string }>().not.toExtend<ListItemProps>();
    });

    it('requires an accessibleLabel when the row can be selected', () => {
      expectTypeOf<{ title: string; onSelect: () => void }>().not.toExtend<ListItemProps>();
      expectTypeOf<{
        title: string;
        onSelect: () => void;
        accessibleLabel: string;
      }>().toExtend<ListItemProps>();
      expectTypeOf<{ title: string }>().toExtend<ListItemProps>();
    });

    it('requires a busyLabel when the row is busy', () => {
      expectTypeOf<{ title: string; busy: true }>().not.toExtend<ListItemProps>();
      expectTypeOf<{ title: string; busy: boolean }>().not.toExtend<ListItemProps>();
      expectTypeOf<{ title: string; busy: boolean; busyLabel: string }>().toExtend<ListItemProps>();
      expectTypeOf<{ title: string; busy: false }>().toExtend<ListItemProps>();
    });
  });

  describe('with onSelect', () => {
    it.each([STATION, STOP])('is a button named «$accessibleLabel»', (texts) => {
      render(<ListItem {...texts} onSelect={() => {}} />);
      const row = screen.getByRole('button', { name: texts.accessibleLabel });

      expect(row).toHaveAttribute('type', 'button');
      expect(row).toHaveTextContent(texts.title);
      expect(row).toHaveTextContent(texts.leadingText);
    });

    it('holds every visible slot inside the button', () => {
      const { row } = renderRow({
        below: <Tag label="5" />,
        trailingCaption: { text: 'Pocas', tone: 'warning' },
      });

      expect(row).toHaveTextContent(STATION.subtitle);
      expect(within(row).getByText('5')).toBeInTheDocument();
      expect(within(row).getByText('Pocas')).toBeInTheDocument();
      expect(within(row).getByText('3')).toBeInTheDocument();
    });

    it('calls onSelect when clicked', async () => {
      const { row, onSelect } = renderRow();

      await userEvent.click(row);

      expect(onSelect).toHaveBeenCalledOnce();
    });

    it.each(['{Enter}', ' '])('is reached with Tab and selected with %s', async (key) => {
      const { row, onSelect } = renderRow();

      await userEvent.tab();
      expect(row).toHaveFocus();
      await userEvent.keyboard(key);

      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('draws the 64 px row with a transparent 2 px border, its ring and its hover', () => {
      const { row } = renderRow();

      expect(row).toHaveClass('min-h-16', 'gap-3', 'rounded-control', 'border-2');
      expect(row).toHaveClass('border-transparent', 'focus-ring');
      expect(row).toHaveClass('hover:bg-chip', 'active:bg-line');
    });

    it('is not the current row by default', () => {
      expect(renderRow().row).not.toHaveAttribute('aria-current');
    });
  });

  describe('without onSelect', () => {
    it('is a static div with no button, named by its visible text', () => {
      const { row } = renderStaticRow({ subtitle: 'Hacia Atocha' });

      expect(row.tagName).toBe('DIV');
      expect(screen.queryByRole('button')).toBeNull();
      expect(row).toHaveTextContent('ATOCHAHacia Atocha');
    });

    it('has no hover, press or focus ring', () => {
      const { row } = renderStaticRow();

      expect(row).not.toHaveClass('hover:bg-chip', 'active:bg-line', 'focus-ring');
    });

    it('takes its own IconButton in trailing without nesting buttons', async () => {
      const onShow = vi.fn<() => void>();
      const { container } = render(
        <ul>
          <li>
            <ListItem
              leading={<Tag label="51" />}
              title="ATOCHA"
              trailing={
                <IconButton
                  label="Ver en el mapa el autobús de la línea 51"
                  icon="pin"
                  variant="outline"
                  iconTone="primary"
                  pressed={false}
                  onClick={onShow}
                />
              }
            />
          </li>
        </ul>,
      );
      const button = screen.getByRole('button', {
        name: 'Ver en el mapa el autobús de la línea 51',
      });

      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(button.parentElement?.closest('button')).toBeNull();
      await userEvent.click(button);
      expect(onShow).toHaveBeenCalledOnce();
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('slots', () => {
    it('draws the leading box from leadingText', () => {
      const box = leadingBoxOf(renderRow().row);

      expect(box).toHaveClass('h-8', 'min-w-11', 'rounded-chip', 'bg-chip', 'text-body');
      expect(box).toHaveClass('font-bold', 'text-tone-neutral-soft-foreground');
    });

    it('lets leading replace the box', () => {
      const { row } = renderRow({ leading: <Tag label="51" /> });

      expect(within(row).queryByText(STATION.leadingText)).toBeNull();
      expect(within(row).getByText('51').closest('.bg-tag')).not.toBeNull();
    });

    it('draws no leading box without leadingText or leading', () => {
      const { row } = renderStaticRow();

      expect(row.firstElementChild).toHaveTextContent('ATOCHA');
    });

    it('draws the title as a label and the subtitle as meta text', () => {
      const { row } = renderRow();

      expect(within(row).getByText(STATION.title)).toHaveClass('text-label', 'text-fg');
      expect(within(row).getByText(STATION.subtitle)).toHaveClass('text-meta', 'text-fg-muted');
    });

    it('puts the below line 5 px under the title', () => {
      const { row } = renderStaticRow({
        below: (
          <span>
            <Tag label="5" />
            <Tag label="15" />
          </span>
        ),
      });
      const below = within(row).getByText('15').closest('span.mt-0\\.75');

      expect(below).not.toBeNull();
      expect(row.querySelector('.gap-0\\.5')).toContainElement(below as HTMLElement);
    });

    it.each([
      ['warning', 'text-tone-warning-label'],
      ['success', 'text-tone-success-label'],
      ['danger', 'text-tone-danger-label'],
    ] as const)('draws a %s trailing caption in its label color', (tone, color) => {
      const { row } = renderRow({ trailingCaption: { text: 'Pocas', tone } });

      expect(within(row).getByText('Pocas')).toHaveClass('text-caption', color);
    });

    it('stacks the caption 2 px under the trailing slot', () => {
      const { row } = renderRow({ trailingCaption: { text: 'Pocas', tone: 'warning' } });

      expect(within(row).getByText('Pocas').parentElement).toHaveClass(
        'flex-col',
        'items-end',
        'gap-0.5',
      );
    });
  });

  describe('selected', () => {
    it('is the current row, soft primary with a primary border', () => {
      const { row } = renderRow({ selected: true });

      expect(row).toHaveAttribute('aria-current', 'true');
      expect(row).toHaveClass('bg-primary-soft', 'border-primary');
      expect(row).not.toHaveClass('border-transparent', 'hover:bg-chip');
    });

    it('turns the leading box to the surface color', () => {
      const box = leadingBoxOf(renderRow({ selected: true }).row);

      expect(box).toHaveClass('bg-surface');
      expect(box).not.toHaveClass('bg-chip');
    });
  });

  describe('busy', () => {
    const BUSY = { busy: true, busyLabel: 'Cargando disponibilidad' } as const;

    it('replaces the trailing slot with a 20 px spinner', () => {
      const { row } = renderRow(BUSY);
      const spinner = row.querySelector(`path[d="${SPINNER_ARC}"]`)?.closest('svg');

      expect(spinner).toHaveAttribute('width', '20');
      expect(within(row).queryByText('3')).toBeNull();
    });

    it('marks the row busy and describes it with the hidden busyLabel', () => {
      const { row } = renderRow(BUSY);

      expect(row).toHaveAttribute('aria-busy', 'true');
      expect(within(row).getByText(BUSY.busyLabel)).toHaveClass('sr-only');
      expect(row).toHaveAccessibleDescription(BUSY.busyLabel);
      expect(row).toHaveAccessibleName(STATION.accessibleLabel);
    });

    it('keeps the hidden busyLabel in a static row', () => {
      const { row } = renderStaticRow({ busy: true, busyLabel: 'Cargando llegadas' });

      expect(row).toHaveAttribute('aria-busy', 'true');
      expect(within(row).getByText('Cargando llegadas')).toHaveClass('sr-only');
    });

    it('is not busy by default', () => {
      expect(renderRow().row).not.toHaveAttribute('aria-busy');
    });

    it('ignores presses and keeps the focus while busy, like Button', async () => {
      const { row, onSelect } = renderRow(BUSY);

      await userEvent.click(row);
      row.focus();
      await userEvent.keyboard('{Enter}');

      expect(onSelect).not.toHaveBeenCalled();
      expect(row).toHaveAttribute('aria-disabled', 'true');
      expect(row).not.toBeDisabled();
      expect(row).toHaveFocus();
    });

    it('drops hover and pressed colors while busy', () => {
      expect(renderRow(BUSY).row).not.toHaveClass('hover:bg-chip', 'active:bg-line');
    });
  });

  describe('disabled', () => {
    it('cannot be selected and drops hover and press', async () => {
      const { row, onSelect } = renderRow({ disabled: true });

      expect(row).toBeDisabled();
      expect(row).not.toHaveClass('hover:bg-chip', 'active:bg-line');
      await userEvent.click(row);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('mutes the title', () => {
      const { row } = renderRow({ disabled: true });

      expect(within(row).getByText(STATION.title)).toHaveClass('text-fg-muted');
      expect(within(row).getByText(STATION.title)).not.toHaveClass('text-fg');
    });
  });

  describe('density', () => {
    it.each([
      ['md', 'p-2.5', ['h-8', 'min-w-11']],
      ['sm', 'p-2', ['h-7.5', 'min-w-10']],
    ] as const)('pads a %s row with %s', (density, padding, boxClasses) => {
      const { row } = renderRow({ density });

      expect(row).toHaveClass(padding);
      expect(leadingBoxOf(row)).toHaveClass(...boxClasses);
    });
  });

  describe('accessibility', () => {
    it.each([
      ['normal', {}],
      ['selected', { selected: true }],
      ['busy', { busy: true, busyLabel: 'Cargando disponibilidad' }],
      ['disabled', { disabled: true }],
      ['sm with caption', { density: 'sm', trailingCaption: { text: 'Pocas', tone: 'warning' } }],
    ] as const)('passes axe when %s', async (_state, props) => {
      const { container } = renderRow(props);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });

    it('passes axe as a stop row with its lines below', async () => {
      const { container } = render(
        <ul>
          <li>
            <ListItem
              {...STOP}
              onSelect={() => {}}
              below={
                <span className="flex gap-1">
                  <span className="sr-only">Líneas:</span>
                  <Tag label="5" />
                  <Tag label="15" />
                  <Tag label="20" />
                </span>
              }
              trailing={<span>140 m</span>}
            />
          </li>
        </ul>,
      );

      expect(screen.getByRole('button', { name: STOP.accessibleLabel })).toHaveTextContent('140 m');
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
});
