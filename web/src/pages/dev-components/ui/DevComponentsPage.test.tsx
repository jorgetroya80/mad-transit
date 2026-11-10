import { render, screen, within } from '@testing-library/react';
import { ICON_NAMES, ICON_SIZES } from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { DevComponentsPage } from './DevComponentsPage';

describe('DevComponentsPage', () => {
  it('passes axe with every piece on the page', async () => {
    const { container } = render(<DevComponentsPage />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it('shows a swatch for every tone token', () => {
    render(<DevComponentsPage />);
    const tones = screen.getByRole('region', { name: 'Tonos' });

    expect(within(tones).getByText('tone-success-soft')).toBeInTheDocument();
    expect(within(tones).getByText('tone-warning-dot')).toBeInTheDocument();
    expect(within(tones).getByText('tone-inverse-icon')).toBeInTheDocument();
  });

  it.each(ICON_NAMES)('shows %s at every size', (name) => {
    render(<DevComponentsPage />);
    const icon = screen.getByRole('listitem', { name });

    expect(icon.querySelectorAll('svg')).toHaveLength(ICON_SIZES.length);
  });

  it('shows every Button look in its three states and the three sizes', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'Button' });

    expect(within(section).getAllByRole('button', { name: 'Reintentar' })).toHaveLength(10);
    expect(within(section).getAllByRole('button', { name: 'Ver horarios' })).toHaveLength(3);
    expect(within(section).getByRole('button', { name: 'Activar' })).toHaveClass('h-10');
  });

  it('shows the IconButton toggled on and off under the same name', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'IconButton' });
    const stars = within(section).getAllByRole('button', { name: 'Favorita' });

    expect(stars.map((star) => star.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
      'true',
    ]);
    expect(within(section).getByTitle('Quitar de favoritas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
