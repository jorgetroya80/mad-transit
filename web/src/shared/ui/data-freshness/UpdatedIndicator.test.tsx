import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { UpdatedIndicator } from './UpdatedIndicator';

const NOW = new Date('2026-11-02T10:20:00Z');
const THIRTY_SECONDS_AGO = new Date('2026-11-02T10:19:30Z');
const SIX_MINUTES_AGO = new Date('2026-11-02T10:14:00Z');

function noop() {}

// Promise.withResolvers is ES2024; the project targets ES2022.
function pendingRetry() {
  let resolve: () => void = noop;
  let reject: (reason: Error) => void = noop;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('UpdatedIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    {
      status: 'ok',
      updatedAt: THIRTY_SECONDS_AGO,
      text: 'Actualizado hace 30 segundos',
      action: 'Actualizar',
    },
    {
      status: 'stale',
      updatedAt: SIX_MINUTES_AGO,
      text: 'Datos de hace 6 minutos',
      action: 'Reintentar',
    },
    { status: 'error', updatedAt: undefined, text: 'Sin datos del servicio', action: 'Reintentar' },
    { status: 'offline', updatedAt: SIX_MINUTES_AGO, text: 'Desconectado', action: 'Reintentar' },
  ] as const)(
    'in $status says «$text» and offers «$action»',
    ({ status, updatedAt, text, action }) => {
      const { container } = render(
        <UpdatedIndicator status={status} updatedAt={updatedAt} onRetry={noop} />,
      );

      expect(container).toHaveTextContent(text);
      expect(screen.getByRole('button', { name: action })).toBeInTheDocument();
    },
  );

  it.each([
    {
      status: 'ok',
      updatedAt: THIRTY_SECONDS_AGO,
      text: 'Actualizado hace 30 segundos',
      dot: 'bg-tone-success',
      color: 'text-fg-muted',
    },
    {
      status: 'stale',
      updatedAt: SIX_MINUTES_AGO,
      text: 'Datos de hace 6 minutos',
      dot: 'bg-tone-warning-dot',
      color: 'text-tone-warning-label',
    },
    {
      status: 'error',
      updatedAt: undefined,
      text: 'Sin datos del servicio',
      dot: 'bg-tone-danger-line',
      color: 'text-tone-danger-label',
    },
    {
      status: 'offline',
      updatedAt: SIX_MINUTES_AGO,
      text: 'Desconectado',
      dot: 'bg-handle',
      color: 'text-fg-muted',
    },
  ] as const)('draws $status in its status tone', ({ status, updatedAt, text, dot, color }) => {
    render(<UpdatedIndicator status={status} updatedAt={updatedAt} onRetry={noop} />);
    const statusText = screen.getByText(text);

    expect(statusText).toHaveClass('text-body', color);
    expect(statusText.querySelector('[aria-hidden="true"]')).toHaveClass(dot);
  });

  it('is no live region, as its text ticks', () => {
    render(<UpdatedIndicator status="ok" updatedAt={THIRTY_SECONDS_AGO} onRetry={noop} />);

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('ages its text as time goes by', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { container } = render(
      <UpdatedIndicator status="ok" updatedAt={THIRTY_SECONDS_AGO} onRetry={noop} />,
    );

    act(() => vi.advanceTimersByTime(30_000));

    expect(container).toHaveTextContent('Actualizado hace 1 minuto');
  });

  it('acts with a small secondary button with the refresh icon', () => {
    render(<UpdatedIndicator status="ok" updatedAt={THIRTY_SECONDS_AGO} onRetry={noop} />);
    const button = screen.getByRole('button', { name: 'Actualizar' });

    expect(button).toHaveClass('h-10', 'border-primary', 'text-primary');
    expect(button.querySelector('path')).toHaveAttribute('d', ICON_DRAWINGS.refresh.paths[0]);
  });

  it('says the data is unconfirmed when stale data has no known age', () => {
    const { container } = render(
      <UpdatedIndicator status="stale" updatedAt={undefined} onRetry={noop} />,
    );

    expect(container).toHaveTextContent('Datos sin confirmar');
  });

  it('says the data is unconfirmed when stale data is from just now', () => {
    render(<UpdatedIndicator status="stale" updatedAt={NOW} onRetry={noop} />);

    expect(screen.getByText('Datos sin confirmar')).toBeInTheDocument();
  });

  it('says it is updated when fresh data has no known time', () => {
    render(<UpdatedIndicator status="ok" updatedAt={undefined} onRetry={noop} />);

    expect(screen.getByText('Actualizado')).toBeInTheDocument();
  });

  it('says it is loading without a button', () => {
    render(<UpdatedIndicator status="loading" updatedAt={undefined} onRetry={noop} />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('stays busy until the retry settles', async () => {
    const { promise, resolve } = pendingRetry();
    const onRetry = vi.fn<() => Promise<void>>(() => promise);
    render(<UpdatedIndicator status="error" updatedAt={undefined} onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: 'Reintentar' });

    await userEvent.click(button);

    expect(onRetry).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveFocus();
    await act(async () => resolve());
    expect(button).not.toHaveAttribute('aria-busy', 'true');
  });

  it('stops being busy when the retry fails', async () => {
    const { promise, reject } = pendingRetry();
    render(<UpdatedIndicator status="error" updatedAt={undefined} onRetry={() => promise} />);
    const button = screen.getByRole('button', { name: 'Reintentar' });

    await userEvent.click(button);
    await act(async () => reject(new Error('network')));

    expect(button).not.toHaveAttribute('aria-busy', 'true');
  });

  it('is not busy when the retry returns nothing', async () => {
    const onRetry = vi.fn<() => void>();
    render(<UpdatedIndicator status="ok" updatedAt={THIRTY_SECONDS_AGO} onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: 'Actualizar' });

    await userEvent.click(button);

    expect(onRetry).toHaveBeenCalledOnce();
    expect(button).not.toHaveAttribute('aria-busy', 'true');
  });

  it.each([
    ['ok', THIRTY_SECONDS_AGO],
    ['offline', SIX_MINUTES_AGO],
  ] as const)('has no axe violations in %s', async (status, updatedAt) => {
    vi.useRealTimers();
    const { container } = render(
      <UpdatedIndicator status={status} updatedAt={updatedAt} onRetry={noop} />,
    );

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
