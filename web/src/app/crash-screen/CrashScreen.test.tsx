import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../test/axe';
import { CrashScreen } from '.';

const MESSAGE =
  'La aplicación ha tenido un error inesperado. Recarga la página para seguir; tus favoritas se mantienen.';

function heading() {
  return screen.getByRole('heading', { level: 1, name: 'Algo ha fallado' });
}

describe('CrashScreen', () => {
  it('fills the page with a main landmark and announces the failure once', () => {
    render(<CrashScreen />);

    expect(screen.getByRole('main')).toContainElement(heading());
    expect(screen.getByRole('alert')).toHaveTextContent(`Algo ha fallado${MESSAGE}`);
  });

  it('moves the focus to its heading when it appears', () => {
    render(<CrashScreen />);

    expect(heading()).toHaveFocus();
  });

  it('reloads the page from Recargar', async () => {
    const reload = vi.fn<() => void>();
    vi.stubGlobal('location', { ...window.location, reload });
    render(<CrashScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'Recargar' }));

    expect(reload).toHaveBeenCalledOnce();
  });

  it('passes axe', async () => {
    const { container } = render(<CrashScreen />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
