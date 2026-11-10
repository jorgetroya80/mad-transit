import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { SegmentedControl } from '.';

type SegmentedControlProps = ComponentProps<typeof SegmentedControl>;
type SegmentedOption = SegmentedControlProps['options'][number];
type ControlOptions = Partial<SegmentedControlProps>;

const SERVICE_OPTIONS = [
  { value: 'bikes', label: 'BiciMAD', icon: 'bike' },
  { value: 'buses', label: 'Bus', icon: 'bus' },
] as const satisfies readonly SegmentedOption[];

const NEED_OPTIONS = [
  { value: 'take', label: 'Sacar bici', description: 'Bicis disponibles', icon: 'bike' },
  { value: 'leave', label: 'Dejar bici', description: 'Anclajes libres', icon: 'dock' },
] as const satisfies readonly SegmentedOption[];

const DIRECTION_OPTIONS = [
  { value: 'sol', label: 'Hacia Sol' },
  { value: 'chamartin', label: 'Hacia Chamartín' },
] as const satisfies readonly SegmentedOption[];

function renderControl(props: ControlOptions = {}) {
  const onChange = vi.fn<(value: string) => void>();
  const { container } = render(
    <SegmentedControl
      label="Servicio"
      options={SERVICE_OPTIONS}
      value="bikes"
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange, container };
}

function segment(name: string) {
  return screen.getByRole('button', { name });
}

describe('SegmentedControl', () => {
  it('requires a label for the group and for each option', () => {
    expectTypeOf<Pick<SegmentedControlProps, 'label'>>().toEqualTypeOf<{ label: string }>();
    expectTypeOf<Pick<SegmentedOption, 'label'>>().toEqualTypeOf<{ label: string }>();
  });

  it.each([
    ['Servicio', SERVICE_OPTIONS],
    ['Sentido', DIRECTION_OPTIONS],
  ])('names the group «%s» and each segment after its option', (label, options) => {
    render(
      <SegmentedControl
        label={label}
        options={options}
        value={options[0].value}
        onChange={vi.fn<(value: string) => void>()}
      />,
    );

    expect(screen.getByRole('group', { name: label })).toBeInTheDocument();
    for (const option of options) {
      expect(segment(option.label)).toHaveAttribute('type', 'button');
    }
  });

  it('hides the label by default: a group named by aria-label', () => {
    const { container } = renderControl();

    expect(screen.getByRole('group', { name: 'Servicio' })).toHaveAttribute(
      'aria-label',
      'Servicio',
    );
    expect(container.querySelector('legend')).toBeNull();
  });

  it('shows the label as the legend of a fieldset', () => {
    const { container } = renderControl({ labelVisible: true });
    const group = screen.getByRole('group', { name: 'Servicio' });

    expect(group.tagName).toBe('FIELDSET');
    expect(container.querySelector('legend')).toHaveTextContent('Servicio');
  });

  it('marks the chosen option with aria-pressed', () => {
    renderControl({ value: 'buses' });

    expect(segment('Bus')).toHaveAttribute('aria-pressed', 'true');
    expect(segment('BiciMAD')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the value of another option', async () => {
    const { onChange } = renderControl();

    await userEvent.click(segment('Bus'));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('buses');
  });

  it('does not call onChange for the option already chosen', async () => {
    const { onChange } = renderControl();

    await userEvent.click(segment('BiciMAD'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the icon of each option', () => {
    renderControl();
    const path = segment('Bus').querySelector('svg path');

    expect(path).toHaveAttribute('d', ICON_DRAWINGS.bus.paths[0]);
  });

  it('focuses every segment with the library ring', () => {
    renderControl();

    expect(segment('BiciMAD')).toHaveClass('focus-ring');
    expect(segment('Bus')).toHaveClass('focus-ring');
  });

  describe('keyboard', () => {
    it('tabs through each segment, without arrow keys', async () => {
      renderControl({ options: NEED_OPTIONS, value: 'take' });

      await userEvent.tab();
      expect(segment('Sacar bici')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(segment('Sacar bici')).toHaveFocus();
      await userEvent.tab();
      expect(segment('Dejar bici')).toHaveFocus();
    });

    it.each(['{Enter}', ' '])('chooses the focused segment with %s', async (key) => {
      const { onChange } = renderControl();

      await userEvent.tab();
      await userEvent.tab();
      await userEvent.keyboard(key);

      expect(onChange).toHaveBeenCalledExactlyOnceWith('buses');
    });

    it('skips a disabled option', async () => {
      renderControl({
        options: [
          { value: 'sol', label: 'Hacia Sol', disabled: true },
          { value: 'chamartin', label: 'Hacia Chamartín' },
        ],
        value: 'chamartin',
      });

      await userEvent.tab();

      expect(segment('Hacia Chamartín')).toHaveFocus();
      expect(segment('Hacia Sol')).toBeDisabled();
    });

    it('skips the whole disabled group', async () => {
      render(
        <>
          <SegmentedControl
            label="Servicio"
            options={SERVICE_OPTIONS}
            value="bikes"
            onChange={vi.fn<(value: string) => void>()}
            disabled
          />
          <button type="button">Después</button>
        </>,
      );

      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'Después' })).toHaveFocus();
      expect(segment('BiciMAD')).toBeDisabled();
      expect(segment('Bus')).toBeDisabled();
    });
  });

  describe('variant="tray"', () => {
    it('is the default: a chip tray of 44 px segments', () => {
      const { container } = renderControl();

      expect(container.querySelector('.bg-chip')).toHaveClass('rounded-card', 'p-1', 'gap-1');
      expect(segment('Bus')).toHaveClass('h-11', 'rounded-segment', 'text-label');
    });

    it('draws a normal segment transparent with fg text and hover and press fills', () => {
      renderControl();

      expect(segment('Bus')).toHaveClass(
        'bg-transparent',
        'text-fg',
        'hover:bg-line',
        'active:bg-line-strong',
      );
    });

    it('draws the chosen segment on surface in primary, bold, with the segment shadow', () => {
      renderControl();

      expect(segment('BiciMAD')).toHaveClass(
        'bg-surface',
        'text-primary',
        'shadow-segment',
        'font-bold',
      );
      expect(segment('BiciMAD').className).not.toMatch(/hover:/);
    });

    it('greys out the text when disabled and drops hover', () => {
      renderControl({ disabled: true });

      expect(segment('Bus')).toHaveClass('text-fg-muted');
      expect(segment('BiciMAD')).toHaveClass('text-fg-muted', 'bg-surface', 'shadow-segment');
      expect(segment('Bus').className).not.toMatch(/hover:|active:/);
    });

    it('shows a 20 px icon', () => {
      renderControl();

      expect(segment('Bus').querySelector('svg')).toHaveAttribute('width', '20');
    });
  });

  describe('variant="cards"', () => {
    function renderCards(props: ControlOptions = {}) {
      return renderControl({ variant: 'cards', options: NEED_OPTIONS, value: 'take', ...props });
    }

    it('lays out two columns of 56 px cards with a 22 px icon', () => {
      const { container } = renderCards();

      expect(container.querySelector('.grid-cols-2')).toHaveClass('gap-2');
      expect(segment('Dejar bici')).toHaveClass('min-h-14', 'rounded-card', 'border-2');
      expect(segment('Dejar bici').querySelector('svg')).toHaveAttribute('width', '22');
    });

    it('keeps the label as the name and the description in aria-describedby', () => {
      renderCards();

      expect(segment('Sacar bici')).toHaveAccessibleDescription('Bicis disponibles');
      expect(segment('Dejar bici')).toHaveAccessibleDescription('Anclajes libres');
    });

    it('draws a normal card on surface with a line-strong border', () => {
      renderCards();

      expect(segment('Dejar bici')).toHaveClass(
        'bg-surface',
        'border-line-strong',
        'text-fg',
        'hover:bg-chip',
        'active:bg-line',
      );
    });

    it('fills the chosen card with primary and darkens it on hover', () => {
      renderCards();

      expect(segment('Sacar bici')).toHaveClass(
        'bg-primary',
        'border-primary',
        'text-primary-foreground',
        'hover:bg-primary-hover',
      );
    });

    it('greys out every card when disabled', () => {
      renderCards({ disabled: true });

      for (const name of ['Sacar bici', 'Dejar bici']) {
        expect(segment(name)).toHaveClass('bg-surface-disabled', 'text-fg-muted');
        expect(segment(name).className).not.toMatch(/hover:|active:/);
      }
    });
  });

  describe('variant="pill"', () => {
    function renderPill(props: ControlOptions = {}) {
      return renderControl({
        variant: 'pill',
        label: 'Sentido',
        options: DIRECTION_OPTIONS,
        value: 'sol',
        ...props,
      });
    }

    it('floats a surface pill of 40 px segments with 13/600 text', () => {
      const { container } = renderPill();

      expect(container.querySelector('.shadow-pill')).toHaveClass(
        'bg-surface',
        'rounded-full',
        'p-1',
        'gap-1',
      );
      expect(segment('Hacia Chamartín')).toHaveClass(
        'h-10',
        'px-3',
        'rounded-full',
        'text-meta',
        'font-semibold',
      );
    });

    it('enlarges the 40 px hit area to 44 px without changing the drawing', () => {
      renderPill();

      expect(segment('Hacia Sol')).toHaveClass(
        'relative',
        'after:absolute',
        'after:inset-x-0',
        'after:-inset-y-0.5',
      );
    });

    it('draws a normal segment transparent with chip hover', () => {
      renderPill();

      expect(segment('Hacia Chamartín')).toHaveClass(
        'bg-transparent',
        'text-fg',
        'hover:bg-chip',
        'active:bg-line',
      );
    });

    it('marks the chosen segment soft by default: primary-soft with a 2 px inner ring', () => {
      renderPill();

      expect(segment('Hacia Sol')).toHaveClass(
        'bg-primary-soft',
        'text-primary',
        'inset-ring-2',
        'inset-ring-primary',
      );
    });

    it('marks the chosen segment solid in primary, darker on hover', () => {
      renderPill({ emphasis: 'solid' });

      expect(segment('Hacia Sol')).toHaveClass(
        'bg-primary',
        'text-primary-foreground',
        'hover:bg-primary-hover',
      );
    });

    it('greys out the text when disabled', () => {
      renderPill({ disabled: true });

      expect(segment('Hacia Sol')).toHaveClass('bg-chip', 'text-fg-muted');
      expect(segment('Hacia Chamartín')).toHaveClass('bg-transparent', 'text-fg-muted');
    });
  });

  describe('busy', () => {
    it.each([
      ['tray', SERVICE_OPTIONS, 20],
      ['cards', NEED_OPTIONS, 22],
      ['pill', DIRECTION_OPTIONS, 16],
    ] as const)('%s swaps the icon of the busy option for a spinner', (variant, options, size) => {
      const busyOption = options[0];
      renderControl({ variant, options, value: busyOption.value, busyValue: busyOption.value });
      const busySegment = segment(busyOption.label);
      const svgs = busySegment.querySelectorAll('svg');

      expect(busySegment).toHaveAttribute('aria-busy', 'true');
      expect(svgs).toHaveLength(1);
      expect(svgs[0]).toHaveClass('animate-spin');
      expect(svgs[0]).toHaveAttribute('width', String(size));
      expect(busySegment).toHaveTextContent(busyOption.label);
    });

    it('keeps the other options as they are', () => {
      renderControl({ busyValue: 'bikes' });

      expect(segment('Bus')).not.toHaveAttribute('aria-busy');
      expect(segment('Bus').querySelector('.animate-spin')).toBeNull();
    });
  });

  it.each([
    ['tray', { options: SERVICE_OPTIONS, value: 'bikes' }],
    ['tray with legend', { options: SERVICE_OPTIONS, value: 'bikes', labelVisible: true }],
    ['tray disabled', { options: SERVICE_OPTIONS, value: 'bikes', disabled: true }],
    ['tray busy', { options: SERVICE_OPTIONS, value: 'buses', busyValue: 'buses' }],
    ['cards', { variant: 'cards', options: NEED_OPTIONS, value: 'take' }],
    ['cards disabled', { variant: 'cards', options: NEED_OPTIONS, value: 'take', disabled: true }],
    ['cards busy', { variant: 'cards', options: NEED_OPTIONS, value: 'take', busyValue: 'take' }],
    ['pill soft', { variant: 'pill', options: DIRECTION_OPTIONS, value: 'sol' }],
    [
      'pill solid',
      { variant: 'pill', emphasis: 'solid', options: SERVICE_OPTIONS, value: 'buses' },
    ],
    [
      'pill with a disabled option',
      {
        variant: 'pill',
        options: [DIRECTION_OPTIONS[0], { ...DIRECTION_OPTIONS[1], disabled: true }],
        value: 'sol',
      },
    ],
  ] as const satisfies readonly (readonly [string, ControlOptions])[])(
    'passes axe as %s',
    async (_name, props) => {
      const { container } = renderControl(props);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    },
  );
});
