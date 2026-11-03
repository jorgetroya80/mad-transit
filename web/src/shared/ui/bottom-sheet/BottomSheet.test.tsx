import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { BottomSheet } from './BottomSheet';
import type { SheetSnap } from './sheetSize';

const STRIP_TEXT = 'Mostrar lista · 2 estaciones con bicis';

function renderSheet(snap: SheetSnap, header?: ReactNode) {
  const onSnapChange = vi.fn<(snap: SheetSnap) => void>();
  const view = render(
    <BottomSheet
      label="Estaciones"
      snap={snap}
      onSnapChange={onSnapChange}
      hideLabel="Ocultar lista"
      collapsedLabel={STRIP_TEXT}
      header={header}
    >
      <p>Contenido del panel</p>
    </BottomSheet>,
  );
  const handle = screen.getByRole('button', { name: /lista/ });
  const content = screen.getByText('Contenido del panel').parentElement;
  const sheet = handle.parentElement;
  return { ...view, handle, content, sheet, onSnapChange };
}

describe('BottomSheet', () => {
  it.each([
    ['half', 'hidden'],
    ['hidden', 'half'],
  ] as const)('asks the parent to go from %s to %s and waits for it', async (snap, next) => {
    const user = userEvent.setup();
    const { handle, onSnapChange } = renderSheet(snap);

    await user.click(handle);

    expect(onSnapChange).toHaveBeenCalledExactlyOnceWith(next);
    expect(screen.getByRole('button', { name: /lista/ })).toBe(handle);
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('shows the hidden sheet with %s', async (_key, keys) => {
    const user = userEvent.setup();
    const { handle, onSnapChange } = renderSheet('hidden');

    await user.tab();
    expect(handle).toHaveFocus();
    await user.keyboard(keys);

    expect(onSnapChange).toHaveBeenCalledExactlyOnceWith('half');
  });

  it('draws the handle at half as a full-width 44 px bar named by the parent', () => {
    const { handle } = renderSheet('half');

    expect(handle).toHaveAccessibleName('Ocultar lista');
    expect(handle).toHaveAttribute('type', 'button');
    expect(handle).toHaveAttribute('aria-expanded', 'true');
    expect(handle).toHaveStyle({ height: '44px' });
    expect(handle).toHaveClass('w-full');
    expect(handle.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(handle).toHaveTextContent('');
  });

  // The strip's visible text is its name: no aria-label that could drift from it.
  it('turns the handle at hidden into a 56 px strip named by its visible text', () => {
    const { handle } = renderSheet('hidden');

    expect(handle).toHaveTextContent(STRIP_TEXT);
    expect(handle).toHaveAccessibleName(STRIP_TEXT);
    expect(handle).not.toHaveAttribute('aria-label');
    expect(handle).toHaveAttribute('aria-expanded', 'false');
    expect(handle).toHaveStyle({ height: '56px' });
    expect(handle).toHaveClass('w-full');
    expect(handle.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('keeps the strip text on one line, cut with an ellipsis', () => {
    renderSheet('hidden');

    expect(screen.getByText(STRIP_TEXT)).toHaveClass('truncate');
  });

  it.each(['half', 'hidden'] as const)('points the handle at the content at %s', (snap) => {
    const { handle, content } = renderSheet(snap);

    expect(content).toHaveAttribute('id', handle.getAttribute('aria-controls'));
  });

  // jsdom and Testing Library ignore `inert`, so the tests assert the attribute itself.
  it('makes the header and the content inert and hides them at hidden', () => {
    renderSheet('hidden', <h2>Cabecera</h2>);
    const region = screen.getByText('Cabecera').closest('section');

    expect(region).toHaveAttribute('inert');
    expect(region).toHaveClass('invisible');
    expect(region).toContainElement(screen.getByText('Contenido del panel'));
  });

  it('shows the header and the content at half', () => {
    renderSheet('half', <h2>Cabecera</h2>);
    const region = screen.getByRole('region', { name: 'Estaciones' });

    expect(region).not.toHaveAttribute('inert');
    expect(region).not.toHaveClass('invisible');
  });

  it('puts the header between the handle and the content, across the full width', () => {
    renderSheet('half', <h2>Cabecera</h2>);
    const header = screen.getByRole('heading', { name: 'Cabecera' });
    const handle = screen.getByRole('button', { name: 'Ocultar lista' });
    const content = screen.getByText('Contenido del panel').parentElement;

    expect(handle.compareDocumentPosition(header)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(header.compareDocumentPosition(content as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('labels the sheet content as a region', () => {
    renderSheet('half', <h2>Cabecera</h2>);
    const region = screen.getByRole('region', { name: 'Estaciones' });

    expect(region).toContainElement(screen.getByRole('heading', { name: 'Cabecera' }));
    expect(region).toContainElement(screen.getByText('Contenido del panel'));
  });

  it.each([
    ['hidden', 'min(56px, 100dvh - 166px)'],
    ['half', 'min(430px, 100dvh - 166px)'],
  ] as const)('caps the %s height so the top 166 px stay free', (snap, height) => {
    const { sheet } = renderSheet(snap);

    expect(sheet).toHaveStyle({ height });
  });

  it('overlays the page but keeps the hidden height in the flow, covering nothing above it', () => {
    const { sheet } = renderSheet('half');
    const strip = sheet?.parentElement;

    expect(sheet).toHaveClass('fixed', 'inset-x-0', 'bottom-0');
    expect(strip).toHaveStyle({ height: '56px' });
    expect(strip).toHaveClass('shrink-0');
  });

  it('animates the height unless the user prefers reduced motion', () => {
    const { sheet } = renderSheet('half', <h2>Cabecera</h2>);

    expect(sheet).toHaveClass(
      'transition-[height]',
      'duration-320',
      'ease-sheet',
      'motion-reduce:transition-none',
    );
    expect(screen.getByRole('region', { name: 'Estaciones' })).toHaveClass(
      'motion-reduce:transition-none',
    );
  });

  it.each(['hidden', 'half'] as const)('has no axe violations at %s', async (snap) => {
    const { container } = renderSheet(snap, <h2>Cabecera</h2>);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
