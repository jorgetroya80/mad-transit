import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SheetSnap } from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { firstIconPath, iconPath } from '../../../../test/iconPath';
import { RecenterButton } from './RecenterButton';

function renderButton(snap: SheetSnap, isRecentering = false) {
  const onRecenter = vi.fn<() => void>();
  const view = render(
    <RecenterButton snap={snap} isRecentering={isRecentering} onRecenter={onRecenter} />,
  );
  return { onRecenter, ...view };
}

function recenterButton() {
  return screen.getByRole('button', { name: 'Centrar en mi posición' });
}

// The page places the slot; the library button inside it draws itself.
function recenterSlot() {
  return recenterButton().parentElement;
}

describe('RecenterButton', () => {
  // jsdom's 768 px viewport: the sheet covers 0 px of the map at hidden (its 56 px strip is
  // below the map, so 16 px here is 72 px from the screen edge) and 430 - 56 px at half.
  it.each([
    ['hidden', 16],
    ['half', 390],
  ] as const)('sits 16 px above the sheet at %s', (snap, bottom) => {
    renderButton(snap);

    expect(recenterSlot()).toHaveStyle({ bottom: `${bottom}px` });
    expect(recenterSlot()).toHaveClass('absolute', 'right-4', 'z-10');
  });

  it('moves with the sheet curve, without animation for reduced motion', () => {
    renderButton('half');

    expect(recenterSlot()).toHaveClass(
      'transition-[bottom]',
      'duration-320',
      'ease-sheet',
      'motion-reduce:transition-none',
    );
  });

  it('is a 48 px floating round button with the locate icon in primary blue at 22 px, as the canvas draws it', () => {
    renderButton('half');

    expect(recenterButton()).toHaveClass('size-12', 'rounded-full', 'bg-surface', 'shadow-pill');
    expect(recenterButton()).toHaveClass('text-primary');
    const icon = recenterButton().querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('width', '22');
    expect(firstIconPath(recenterButton())).toBe(iconPath('locate'));
  });

  it('recenters on click', async () => {
    const user = userEvent.setup();
    const { onRecenter } = renderButton('half');

    await user.click(recenterButton());

    expect(onRecenter).toHaveBeenCalledOnce();
  });

  // aria-disabled, not disabled: the button keeps the focus the user just put on it.
  it('is busy and ignores clicks while recentering', async () => {
    const user = userEvent.setup();
    const { onRecenter } = renderButton('half', true);

    await user.click(recenterButton());

    expect(recenterButton()).toHaveAttribute('aria-busy', 'true');
    expect(recenterButton()).toHaveAttribute('aria-disabled', 'true');
    expect(recenterButton()).toBeEnabled();
    expect(onRecenter).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = renderButton('half');

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
