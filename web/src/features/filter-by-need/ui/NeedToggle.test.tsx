import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { NeedToggle } from './NeedToggle';

type AppRouter = Awaited<ReturnType<typeof renderWithRouter>>['router'];

function searchParams(router: AppRouter) {
  return Object.fromEntries(new URL(router.state.location.href, 'http://localhost').searchParams);
}

function toggleButton(name: 'Sacar bici' | 'Dejar bici') {
  return screen.getByRole('button', { name });
}

describe('NeedToggle', () => {
  it('groups both options under an accessible name', async () => {
    await renderWithRouter(<NeedToggle variant="pill" />);

    expect(screen.getByRole('group', { name: '¿Qué quieres hacer?' })).toContainElement(
      toggleButton('Dejar bici'),
    );
  });

  it('presses "Sacar bici" by default', async () => {
    await renderWithRouter(<NeedToggle variant="pill" />);

    expect(toggleButton('Sacar bici')).toHaveAttribute('aria-pressed', 'true');
    expect(toggleButton('Dejar bici')).toHaveAttribute('aria-pressed', 'false');
  });

  it('presses "Dejar bici" with ?need=docks', async () => {
    await renderWithRouter(<NeedToggle variant="pill" />, { initialEntries: ['/?need=docks'] });

    expect(toggleButton('Dejar bici')).toHaveAttribute('aria-pressed', 'true');
    expect(toggleButton('Sacar bici')).toHaveAttribute('aria-pressed', 'false');
  });

  it('writes need=docks without a new history entry and keeps the station', async () => {
    const { router } = await renderWithRouter(<NeedToggle variant="pill" />, {
      initialEntries: ['/?station=538'],
    });
    const entries = router.history.length;

    await userEvent.click(toggleButton('Dejar bici'));

    expect(searchParams(router)).toEqual({ station: '538', need: 'docks' });
    expect(router.history.length).toBe(entries);
    expect(toggleButton('Dejar bici')).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes need from the URL when choosing "Sacar bici"', async () => {
    const { router } = await renderWithRouter(<NeedToggle variant="pill" />, {
      initialEntries: ['/?station=538&need=docks'],
    });

    await userEvent.click(toggleButton('Sacar bici'));

    expect(searchParams(router)).toEqual({ station: '538' });
    expect(toggleButton('Sacar bici')).toHaveAttribute('aria-pressed', 'true');
  });

  it('describes each card with what it lists and switches need with it', async () => {
    const { router } = await renderWithRouter(<NeedToggle variant="cards" />);

    expect(toggleButton('Sacar bici')).toHaveAccessibleDescription('Bicis disponibles');
    expect(toggleButton('Dejar bici')).toHaveAccessibleDescription('Anclajes libres');

    await userEvent.click(toggleButton('Dejar bici'));

    expect(searchParams(router)).toEqual({ need: 'docks' });
    expect(toggleButton('Dejar bici')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows only the titles in the pill', async () => {
    await renderWithRouter(<NeedToggle variant="pill" />);

    expect(toggleButton('Sacar bici')).not.toHaveAccessibleDescription();
    expect(screen.queryByText('Bicis disponibles')).not.toBeInTheDocument();
  });

  it.each(['cards', 'pill'] as const)('has no axe violations as %s', async (variant) => {
    const { container } = await renderWithRouter(<NeedToggle variant={variant} />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
