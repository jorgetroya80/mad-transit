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

  it.each(['{Enter}', ' '])('tabs to "Dejar bici" and picks it with %s', async (key) => {
    const { router } = await renderWithRouter(<NeedToggle variant="cards" />);

    await userEvent.tab();
    expect(toggleButton('Sacar bici')).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard(key);

    expect(searchParams(router)).toEqual({ need: 'docks' });
    expect(toggleButton('Dejar bici')).toHaveFocus();
  });

  it('describes each card with what it lists and switches need with it', async () => {
    const { router } = await renderWithRouter(<NeedToggle variant="cards" />);

    expect(toggleButton('Sacar bici')).toHaveAccessibleDescription('Bicis disponibles');
    expect(toggleButton('Dejar bici')).toHaveAccessibleDescription('Anclajes libres');

    await userEvent.click(toggleButton('Dejar bici'));

    expect(searchParams(router)).toEqual({ need: 'docks' });
    expect(toggleButton('Dejar bici')).toHaveAttribute('aria-pressed', 'true');
  });

  it('draws the library cards with a 22 px icon and the focus ring', async () => {
    await renderWithRouter(<NeedToggle variant="cards" />);

    for (const name of ['Sacar bici', 'Dejar bici'] as const) {
      expect(toggleButton(name)).toHaveClass('min-h-14', 'rounded-card', 'focus-ring');
      expect(toggleButton(name).querySelector('svg')).toHaveAttribute('width', '22');
    }
    expect(toggleButton('Sacar bici')).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('shows only the titles in the pill', async () => {
    await renderWithRouter(<NeedToggle variant="pill" />);

    expect(toggleButton('Sacar bici')).not.toHaveAccessibleDescription();
    expect(screen.queryByText('Bicis disponibles')).not.toBeInTheDocument();
    expect(toggleButton('Sacar bici').querySelector('svg')).toBeNull();
  });

  it('draws the library pill and marks the chosen option soft', async () => {
    await renderWithRouter(<NeedToggle variant="pill" />);

    expect(toggleButton('Dejar bici')).toHaveClass('h-10', 'rounded-full', 'focus-ring');
    expect(toggleButton('Sacar bici')).toHaveClass(
      'bg-primary-soft',
      'text-primary',
      'inset-ring-primary',
    );
  });

  it.each(['cards', 'pill'] as const)('has no axe violations as %s', async (variant) => {
    const { container } = await renderWithRouter(<NeedToggle variant={variant} />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
