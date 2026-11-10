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
});
