import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FAVORITES_STORAGE_KEY } from '@/shared/config';
import { expectNoAxeViolations } from '../../../../test/axe';
import { FavoriteButton } from './FavoriteButton';

function favoriteButton() {
  return screen.getByRole('button', { name: 'Favorita' });
}

describe('FavoriteButton', () => {
  afterEach(() => localStorage.clear());

  it('is not pressed when the station is not a favorite', () => {
    render(<FavoriteButton number="538" />);

    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('is pressed when the station is already a favorite', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['538']));

    render(<FavoriteButton number="538" />);

    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles on click and keeps the same accessible name', async () => {
    render(<FavoriteButton number="538" />);

    await userEvent.click(favoriteButton());
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('["538"]');

    await userEvent.click(favoriteButton());
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles with Enter and Space', async () => {
    render(<FavoriteButton number="538" />);
    favoriteButton().focus();

    await userEvent.keyboard('{Enter}');
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'true');

    await userEvent.keyboard(' ');
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides the star from assistive technology', () => {
    render(<FavoriteButton number="538" />);

    expect(favoriteButton().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  describe('as an icon', () => {
    it('keeps the name «Favorita» and tells the action in its tooltip', async () => {
      render(<FavoriteButton number="538" />);

      const button = screen.getByRole('button', { name: 'Favorita' });
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('title', 'Añadir a favoritas');

      await userEvent.click(button);

      expect(button).toHaveAccessibleName('Favorita');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveAttribute('title', 'Quitar de favoritas');
      expect(localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('["538"]');
    });

    it('fills the star only when pressed', async () => {
      render(<FavoriteButton number="538" />);
      const button = screen.getByRole('button');

      expect(button.querySelector('svg')).toHaveAttribute('fill', 'none');
      await userEvent.click(button);
      expect(button.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    });

    it('has no axe violations', async () => {
      const { container } = render(<FavoriteButton number="538" />);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
});
