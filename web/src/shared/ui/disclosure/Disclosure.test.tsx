import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, useState } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { Disclosure } from '.';

type DisclosureProps = ComponentProps<typeof Disclosure>;
type UncontrolledOptions = Partial<Extract<DisclosureProps, { open?: undefined }>>;

const FAVORITES = { title: 'Favoritas', count: '2', icon: 'star' } as const;
const SCHEDULE = { title: 'Horario de hoy', icon: 'clock' } as const;

function renderDisclosure(props: UncontrolledOptions = {}) {
  const { container } = render(
    <Disclosure {...FAVORITES} {...props}>
      <p>Contenido del panel</p>
    </Disclosure>,
  );
  const button = screen.getByRole('button', { name: /^Favoritas/ });
  const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
  if (!panel) throw new Error('Disclosure rendered no panel');
  return { button, panel, container };
}

function svgsOf(button: HTMLElement) {
  return [...button.querySelectorAll('svg')];
}

function chevronOf(button: HTMLElement) {
  const chevron = svgsOf(button).at(-1);
  if (!chevron) throw new Error('Disclosure rendered no chevron');
  return chevron;
}

function ControlledDisclosure({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [isOpen, setOpen] = useState(false);
  function handleOpenChange(open: boolean) {
    setOpen(open);
    onOpenChange(open);
  }
  return (
    <Disclosure {...FAVORITES} open={isOpen} onOpenChange={handleOpenChange}>
      <p>Contenido del panel</p>
    </Disclosure>
  );
}

describe('Disclosure', () => {
  it('requires a title and its panel', () => {
    expectTypeOf<Pick<DisclosureProps, 'title'>>().toEqualTypeOf<{ title: string }>();
    expectTypeOf<{ title: string }>().not.toExtend<DisclosureProps>();
  });

  it('is controlled only with open and onOpenChange together', () => {
    type Panel = { title: string; children: string };
    expectTypeOf<Panel & { open: boolean }>().not.toExtend<DisclosureProps>();
    expectTypeOf<Panel & { open: boolean; defaultOpen: boolean }>().not.toExtend<DisclosureProps>();
    expectTypeOf<
      Panel & { open: boolean; onOpenChange: (open: boolean) => void }
    >().toExtend<DisclosureProps>();
  });

  describe('structure', () => {
    it('is a section named by its heading, which holds the button', () => {
      renderDisclosure();
      const section = screen.getByRole('region', { name: 'Favoritas · 2' });
      const heading = screen.getByRole('heading', { name: 'Favoritas · 2' });

      expect(section).toContainElement(heading);
      expect(heading.tagName).toBe('H3');
      expect(heading).toContainElement(screen.getByRole('button'));
    });

    it.each([2, 3, 4] as const)('renders an h%s when asked', (headingLevel) => {
      renderDisclosure({ headingLevel });

      expect(screen.getByRole('heading', { level: headingLevel })).toBeInTheDocument();
    });

    it.each([
      [FAVORITES, 'Favoritas · 2'],
      [SCHEDULE, 'Horario de hoy'],
    ])('names the button with the title and the count', (texts, name) => {
      render(
        <Disclosure {...texts}>
          <p>Panel</p>
        </Disclosure>,
      );

      expect(screen.getByRole('button', { name })).toHaveAttribute('type', 'button');
    });

    it('draws the count as meta text after a dot', () => {
      const { button } = renderDisclosure();

      expect(screen.getByText('· 2')).toHaveClass('text-meta', 'text-fg-muted');
      expect(button).toHaveClass('focus-ring', 'min-h-11', 'w-full', 'rounded-control', 'px-2');
      expect(button).toHaveClass('hover:bg-chip', 'active:bg-line');
    });

    it('lets the page move the focus to its heading without a tab stop', async () => {
      const { button } = renderDisclosure();
      const heading = screen.getByRole('heading');

      expect(heading).toHaveAttribute('tabindex', '-1');
      heading.focus();
      expect(heading).toHaveFocus();
      expect(heading).toHaveClass('focus-visible:outline-none');

      await userEvent.tab();
      expect(button).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(heading).not.toHaveFocus();
    });
  });

  describe('icons', () => {
    it.each([
      ['md', 18, 'text-base'],
      ['sm', 16, 'text-body'],
    ] as const)('draws a %s icon at %s px in primary', (size, iconSize, titleSize) => {
      const { button } = renderDisclosure({ size });
      const icon = svgsOf(button)[0];

      expect(icon).toHaveAttribute('width', String(iconSize));
      expect(icon).toHaveClass('text-primary');
      expect(icon?.querySelector('path')).toHaveAttribute('d', ICON_DRAWINGS.star.paths[0]);
      expect(screen.getByText('Favoritas')).toHaveClass(titleSize, 'font-bold', 'text-fg');
    });

    it('draws no leading icon without one', () => {
      const { button } = renderDisclosure({ icon: undefined });

      expect(svgsOf(button)).toHaveLength(1);
    });

    it('draws a 20 px muted chevron that turns without motion when reduced', () => {
      const chevron = chevronOf(renderDisclosure().button);

      expect(chevron).toHaveAttribute('width', '20');
      expect(chevron.querySelector('path')).toHaveAttribute(
        'd',
        ICON_DRAWINGS['chevron-down'].paths[0],
      );
      expect(chevron).toHaveClass('text-fg-muted', 'transition-transform', 'duration-200');
      expect(chevron).toHaveClass('ease-out', 'motion-reduce:transition-none');
    });
  });

  describe('uncontrolled', () => {
    it('starts open, its chevron turned up', () => {
      const { button, panel } = renderDisclosure();

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(panel).toBeVisible();
      expect(panel).toHaveTextContent('Contenido del panel');
      expect(chevronOf(button)).toHaveClass('rotate-180');
    });

    it('starts closed with defaultOpen false', () => {
      const { button, panel } = renderDisclosure({ defaultOpen: false });

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(panel).toHaveAttribute('hidden');
      expect(chevronOf(button)).not.toHaveClass('rotate-180');
    });

    it('toggles on click and tells onOpenChange', async () => {
      const onOpenChange = vi.fn<(open: boolean) => void>();
      const { button, panel } = renderDisclosure({ onOpenChange });

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();
      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      expect(onOpenChange.mock.calls).toEqual([[false], [true]]);
    });

    it.each(['{Enter}', ' '])('toggles with %s and keeps the focus on the button', async (key) => {
      const { button, panel } = renderDisclosure();

      await userEvent.tab();
      expect(button).toHaveFocus();
      await userEvent.keyboard(key);

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(panel).toHaveAttribute('hidden');
      expect(button).toHaveFocus();
    });

    it('stores nothing', async () => {
      const { button } = renderDisclosure();

      await userEvent.click(button);

      expect(localStorage).toHaveLength(0);
    });
  });

  describe('controlled', () => {
    it('follows open and asks onOpenChange to change it', async () => {
      const onOpenChange = vi.fn<(open: boolean) => void>();
      const { rerender } = render(
        <Disclosure {...FAVORITES} open={false} onOpenChange={onOpenChange}>
          <p>Contenido del panel</p>
        </Disclosure>,
      );
      const button = screen.getByRole('button', { name: 'Favoritas · 2' });

      await userEvent.click(button);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(button).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <Disclosure {...FAVORITES} open onOpenChange={onOpenChange}>
          <p>Contenido del panel</p>
        </Disclosure>,
      );
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens and closes with the state of whoever controls it', async () => {
      const onOpenChange = vi.fn<(open: boolean) => void>();
      render(<ControlledDisclosure onOpenChange={onOpenChange} />);
      const button = screen.getByRole('button', { name: 'Favoritas · 2' });

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Contenido del panel')).toBeVisible();
      await userEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    });
  });

  describe('accessibility', () => {
    it.each([
      ['open md', {}],
      ['closed md', { defaultOpen: false }],
      ['open sm', { size: 'sm' }],
      ['closed sm h2', { size: 'sm', defaultOpen: false, headingLevel: 2 }],
      ['without count or icon', { count: undefined, icon: undefined }],
    ] as const)('passes axe %s', async (_state, props) => {
      const { container } = renderDisclosure(props);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
});
