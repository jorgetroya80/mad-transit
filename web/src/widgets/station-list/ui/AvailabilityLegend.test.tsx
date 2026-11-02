import { render, screen, within } from '@testing-library/react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { AvailabilityLegend } from './AvailabilityLegend';

function legend() {
  return screen.getByRole('list', { name: 'Leyenda' });
}

describe('AvailabilityLegend', () => {
  it('lists the five availability levels under a visually hidden heading', () => {
    render(<AvailabilityLegend />);

    expect(screen.getByRole('heading', { name: 'Leyenda' })).toHaveClass('sr-only');
    const items = within(legend()).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      '5 o más',
      '1 a 4',
      'Vacía',
      'Fuera de servicio',
      'Sin confirmar',
    ]);
  });

  it('gives each level a hidden swatch, dashed for an empty station', () => {
    render(<AvailabilityLegend />);

    const swatches = within(legend())
      .getAllByRole('listitem')
      .map((item) => item.querySelector('[aria-hidden="true"]'));
    expect(swatches).toHaveLength(5);
    expect(swatches[0]).toHaveClass('bg-availability-good');
    expect(swatches[1]).toHaveClass('bg-availability-low');
    expect(swatches[2]).toHaveClass('bg-availability-empty', 'border-dashed');
    expect(swatches[3]).toHaveClass('bg-availability-off');
    expect(swatches[4]).toHaveClass('bg-availability-unconfirmed');
    expect(swatches.filter((swatch) => swatch?.classList.contains('border-dashed'))).toHaveLength(
      1,
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(<AvailabilityLegend />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
