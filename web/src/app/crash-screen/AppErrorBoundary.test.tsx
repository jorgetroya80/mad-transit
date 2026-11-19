import { render, screen } from '@testing-library/react';
import { AppErrorBoundary } from '.';

const renderError = new Error('provider failed');

function Broken(): never {
  throw renderError;
}

// React logs the caught error on purpose; a silent spy keeps the test output clean.
function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {});
}

describe('AppErrorBoundary', () => {
  it('shows the crash screen when a child fails to render', () => {
    silenceConsoleError();

    render(
      <AppErrorBoundary>
        <Broken />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Algo ha fallado' })).toBeInTheDocument();
  });

  it('renders its children as they are when nothing fails', () => {
    render(
      <AppErrorBoundary>
        <p>contenido</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Algo ha fallado' })).not.toBeInTheDocument();
  });

  it('still logs a render error to the console', () => {
    const consoleError = silenceConsoleError();

    render(
      <AppErrorBoundary>
        <Broken />
      </AppErrorBoundary>,
    );

    expect(consoleError.mock.calls.some((args) => args.includes(renderError))).toBe(true);
  });
});
