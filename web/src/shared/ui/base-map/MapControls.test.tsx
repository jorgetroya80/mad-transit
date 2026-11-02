import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { MapControls } from './MapControls';

function renderControls(isRecentering = false) {
  const callbacks = {
    onZoomIn: vi.fn<() => void>(),
    onZoomOut: vi.fn<() => void>(),
    onRecenter: vi.fn<() => void>(),
  };
  const view = render(<MapControls {...callbacks} isRecentering={isRecentering} />);
  return { ...callbacks, ...view };
}

describe('MapControls', () => {
  it('stacks zoom in, zoom out and recenter, in that order', () => {
    renderControls();

    expect(
      screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Acercar', 'Alejar', 'Centrar en mi posición']);
  });

  it.each([
    ['Acercar', 'onZoomIn'],
    ['Alejar', 'onZoomOut'],
    ['Centrar en mi posición', 'onRecenter'],
  ] as const)('«%s» calls %s only', async (name, callback) => {
    const callbacks = renderControls();

    await userEvent.click(screen.getByRole('button', { name }));

    expect(callbacks[callback]).toHaveBeenCalledOnce();
    const others = (['onZoomIn', 'onZoomOut', 'onRecenter'] as const).filter(
      (other) => other !== callback,
    );
    others.forEach((other) => expect(callbacks[other]).not.toHaveBeenCalled());
  });

  it('shows only the zoom buttons without a recenter action', () => {
    render(<MapControls onZoomIn={vi.fn<() => void>()} onZoomOut={vi.fn<() => void>()} />);

    expect(
      screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Acercar', 'Alejar']);
  });

  it('keeps «Centrar en mi posición» focusable but busy while recentering, ignoring clicks', async () => {
    const { onRecenter } = renderControls(true);
    const button = screen.getByRole('button', { name: 'Centrar en mi posición' });

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeEnabled();
    expect(onRecenter).not.toHaveBeenCalled();
  });

  it('is neither busy nor disabled while not recentering', () => {
    renderControls();

    const button = screen.getByRole('button', { name: 'Centrar en mi posición' });
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  it('makes each button a 44 px target with a decorative icon', () => {
    renderControls();

    screen.getAllByRole('button').forEach((button) => {
      expect(button).toHaveClass('size-11');
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderControls();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
