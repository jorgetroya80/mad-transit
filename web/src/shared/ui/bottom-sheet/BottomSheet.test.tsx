import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { BottomSheet } from './BottomSheet';
import type { SheetSnap } from './sheetSize';

const LIST_CYCLE: Record<SheetSnap, SheetSnap> = { peek: 'half', half: 'full', full: 'half' };

function renderSheet(snap: SheetSnap, header?: ReactNode) {
  const onSnapChange = vi.fn<(snap: SheetSnap) => void>();
  const view = render(
    <BottomSheet
      label="Estaciones"
      snap={snap}
      onSnapChange={onSnapChange}
      nextSnap={LIST_CYCLE}
      handleLabel={snap === 'full' ? 'Reducir lista' : 'Ampliar lista'}
      header={header}
    >
      <p>Contenido del panel</p>
    </BottomSheet>,
  );
  const handle = screen.getByRole('button', { name: /lista$/ });
  const content = screen.getByText('Contenido del panel').parentElement;
  const sheet = handle.parentElement;
  return { ...view, handle, content, sheet, onSnapChange };
}

describe('BottomSheet', () => {
  it.each([
    ['peek', 'half'],
    ['half', 'full'],
    ['full', 'half'],
  ] as const)('asks the parent for the next snap from %s and waits for it', async (snap, next) => {
    const user = userEvent.setup();
    const { handle, onSnapChange } = renderSheet(snap);

    await user.click(handle);

    expect(onSnapChange).toHaveBeenCalledExactlyOnceWith(next);
    expect(screen.getByRole('button', { name: /lista$/ })).toBe(handle);
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('moves to the next snap with %s', async (_key, keys) => {
    const user = userEvent.setup();
    const { handle, onSnapChange } = renderSheet('peek');

    await user.tab();
    expect(handle).toHaveFocus();
    await user.keyboard(keys);

    expect(onSnapChange).toHaveBeenCalledExactlyOnceWith('half');
  });

  it.each([
    ['peek', 'Ampliar lista', 'false'],
    ['half', 'Ampliar lista', 'true'],
    ['full', 'Reducir lista', 'true'],
  ] as const)(
    'names the handle from the parent and is collapsed only in peek (%s)',
    (snap, name, expanded) => {
      const { handle } = renderSheet(snap);

      expect(handle).toHaveAccessibleName(name);
      expect(handle).toHaveAttribute('type', 'button');
      expect(handle).toHaveAttribute('aria-expanded', expanded);
    },
  );

  it('draws the handle as a 44 px bar hidden from assistive technology', () => {
    const { handle } = renderSheet('half');

    expect(handle).toHaveStyle({ height: '44px' });
    expect(handle.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(handle).toHaveTextContent('');
  });

  it('points the handle at the content', () => {
    const { handle, content } = renderSheet('half');

    expect(content).toHaveAttribute('id', handle.getAttribute('aria-controls'));
  });

  // jsdom and Testing Library ignore `inert`, so the tests assert the attribute itself.
  it('makes the content inert and hides it in peek', () => {
    const { content } = renderSheet('peek');

    expect(content).toHaveAttribute('inert');
    expect(content).toHaveClass('invisible');
  });

  it.each(['half', 'full'] as const)('shows the content in %s', (snap) => {
    const { content } = renderSheet(snap);

    expect(content).not.toHaveAttribute('inert');
    expect(content).not.toHaveClass('invisible');
  });

  it('keeps the header visible between the handle and the content, also in peek', () => {
    renderSheet('peek', <h2>Cabecera</h2>);
    const header = screen.getByRole('heading', { name: 'Cabecera' });
    const handle = screen.getByRole('button', { name: 'Ampliar lista' });
    const content = screen.getByText('Contenido del panel').parentElement;

    expect(handle.compareDocumentPosition(header)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(header.compareDocumentPosition(content as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(header.closest('[inert]')).toBeNull();
  });

  it('labels the sheet content as a region', () => {
    renderSheet('half', <h2>Cabecera</h2>);
    const region = screen.getByRole('region', { name: 'Estaciones' });

    expect(region).toContainElement(screen.getByRole('heading', { name: 'Cabecera' }));
    expect(region).toContainElement(screen.getByText('Contenido del panel'));
  });

  it.each([
    ['peek', 'min(112px, 100dvh - 144px)'],
    ['half', 'min(430px, 100dvh - 144px)'],
    ['full', 'min(700px, 100dvh - 144px)'],
  ] as const)('caps the %s height so the top 144 px stay free', (snap, height) => {
    const { sheet } = renderSheet(snap);

    expect(sheet).toHaveStyle({ height });
  });

  it('overlays the page but keeps the peek height in the flow, covering nothing above it', () => {
    const { sheet } = renderSheet('full');
    const strip = sheet?.parentElement;

    expect(sheet).toHaveClass('fixed', 'inset-x-0', 'bottom-0');
    expect(strip).toHaveStyle({ height: '112px' });
    expect(strip).toHaveClass('shrink-0');
  });

  it('animates the height unless the user prefers reduced motion', () => {
    const { sheet, content } = renderSheet('half');

    expect(sheet).toHaveClass(
      'transition-[height]',
      'duration-320',
      'ease-sheet',
      'motion-reduce:transition-none',
    );
    expect(content).toHaveClass('motion-reduce:transition-none');
  });

  it.each(['peek', 'half', 'full'] as const)('has no axe violations in %s', async (snap) => {
    const { container } = renderSheet(snap, <h2>Cabecera</h2>);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
