import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { ServiceToggle } from './ServiceToggle';

describe('ServiceToggle', () => {
  it('offers BiciMAD and Bus, with BiciMAD chosen by default', async () => {
    await renderWithRouter(<ServiceToggle />);

    expect(screen.getByRole('group', { name: 'Servicio' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'BiciMAD' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Bus' })).not.toBeChecked();
  });

  it('shows Bus chosen from the URL', async () => {
    await renderWithRouter(<ServiceToggle />, { initialEntries: ['/?service=bus'] });

    expect(screen.getByRole('radio', { name: 'Bus' })).toBeChecked();
  });

  it('switches the URL to Bus and keeps the need', async () => {
    const user = userEvent.setup();
    const { router } = await renderWithRouter(<ServiceToggle />, {
      initialEntries: ['/?need=docks'],
    });

    await user.click(screen.getByRole('radio', { name: 'Bus' }));

    expect(router.state.location.href).toBe('/?need=docks&service=bus');
    expect(screen.getByRole('radio', { name: 'Bus' })).toBeChecked();
  });
});
