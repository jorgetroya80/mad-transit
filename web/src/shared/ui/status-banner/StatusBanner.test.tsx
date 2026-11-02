import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { InfoIcon, OfflineIcon, WarningIcon } from '../icons';
import { StatusBanner } from './StatusBanner';

function iconMarkup(Icon: typeof InfoIcon) {
  const { container, unmount } = render(<Icon />);
  const markup = container.querySelector('svg')?.innerHTML;
  unmount();
  return markup;
}

describe('StatusBanner', () => {
  it.each([
    { variant: 'info', role: 'status', Icon: InfoIcon, background: 'bg-primary-soft' },
    { variant: 'stale', role: 'status', Icon: WarningIcon, background: 'bg-notice-stale' },
    { variant: 'offline', role: 'alert', Icon: OfflineIcon, background: 'bg-notice-offline' },
  ] as const)(
    'shows $variant as $role with its icon and colors',
    ({ variant, role, Icon, background }) => {
      const expectedIcon = iconMarkup(Icon);

      render(<StatusBanner variant={variant}>Sin conexión</StatusBanner>);

      const banner = screen.getByRole(role);
      expect(banner).toHaveTextContent('Sin conexión');
      expect(banner).toHaveClass(background);
      const icon = banner.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon?.innerHTML).toBe(expectedIcon);
    },
  );

  it('renders no button without an action', () => {
    render(<StatusBanner variant="info">Sin ubicación</StatusBanner>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the action as a button inside the banner', async () => {
    const onClick = vi.fn<() => void>();

    render(
      <StatusBanner variant="offline" action={{ label: 'Reintentar', onClick }}>
        Sin conexión
      </StatusBanner>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(screen.getByRole('alert')).toContainElement(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(['info', 'stale', 'offline'] as const)('has no axe violations as %s', async (variant) => {
    const { container } = render(
      <StatusBanner variant={variant} action={{ label: 'Reintentar', onClick: () => {} }}>
        Sin conexión
      </StatusBanner>,
    );

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
