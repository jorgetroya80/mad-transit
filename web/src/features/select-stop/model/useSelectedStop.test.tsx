import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { useSelectedStop } from './useSelectedStop';

function StopProbe() {
  const { number, select } = useSelectedStop();
  return (
    <>
      <output>{number ?? 'ninguna'}</output>
      <button type="button" onClick={() => select('72')}>
        Elegir 72
      </button>
    </>
  );
}

type AppRouter = Awaited<ReturnType<typeof renderWithRouter>>['router'];

function searchParams(router: AppRouter) {
  return Object.fromEntries(new URL(router.state.location.href, 'http://localhost').searchParams);
}

describe('useSelectedStop', () => {
  it('reads the stop from the URL with the bus service', async () => {
    await renderWithRouter(<StopProbe />, { initialEntries: ['/?service=bus&stop=72'] });

    expect(screen.getByRole('status')).toHaveTextContent('72');
  });

  it('has no stop without ?stop', async () => {
    await renderWithRouter(<StopProbe />, { initialEntries: ['/?service=bus'] });

    expect(screen.getByRole('status')).toHaveTextContent('ninguna');
  });

  it('ignores ?stop without the bus service', async () => {
    await renderWithRouter(<StopProbe />, { initialEntries: ['/?stop=72'] });

    expect(screen.getByRole('status')).toHaveTextContent('ninguna');
  });

  it('selects with a new history entry, so back removes the stop', async () => {
    const { router } = await renderWithRouter(<StopProbe />, {
      initialEntries: ['/?service=bus'],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Elegir 72' }));

    expect(router.state.location.href).toBe('/?service=bus&stop=72');
    expect(screen.getByRole('status')).toHaveTextContent('72');

    await act(async () => router.history.back());

    expect(searchParams(router)).toEqual({ service: 'bus' });
    expect(screen.getByRole('status')).toHaveTextContent('ninguna');
  });
});
