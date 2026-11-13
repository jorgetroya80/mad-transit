import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { useService } from './useService';

function ServiceProbe() {
  const [service, setService] = useService();
  return (
    <>
      <p>{service}</p>
      <button type="button" onClick={() => setService('bus')}>
        Elegir bus
      </button>
      <button type="button" onClick={() => setService('bicimad')}>
        Elegir bicimad
      </button>
    </>
  );
}

describe('useService', () => {
  it('treats an unknown service as bicimad', async () => {
    await renderWithRouter(<ServiceProbe />, { initialEntries: ['/?service=xyz'] });

    expect(screen.getByText('bicimad')).toBeInTheDocument();
  });

  it('switches to bus and back, dropping the station and the stop but keeping the need', async () => {
    const user = userEvent.setup();
    const { router } = await renderWithRouter(<ServiceProbe />, {
      initialEntries: ['/?station=538&need=docks'],
    });

    await user.click(screen.getByRole('button', { name: 'Elegir bus' }));
    expect(router.state.location.href).toBe('/?need=docks&service=bus');

    await user.click(screen.getByRole('button', { name: 'Elegir bicimad' }));
    expect(router.state.location.href).toBe('/?need=docks');
  });

  it('drops the stop when switching back from bus', async () => {
    const user = userEvent.setup();
    const { router } = await renderWithRouter(<ServiceProbe />, {
      initialEntries: ['/?service=bus&stop=72'],
    });

    await user.click(screen.getByRole('button', { name: 'Elegir bicimad' }));

    expect(router.state.location.href).toBe('/');
  });
});
