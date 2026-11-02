import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { MapControls } from './MapControls';

function renderControls() {
  const callbacks = {
    onZoomIn: vi.fn<() => void>(),
    onZoomOut: vi.fn<() => void>(),
    onRecenter: vi.fn<() => void>(),
  };
  const view = render(<MapControls {...callbacks} />);
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
