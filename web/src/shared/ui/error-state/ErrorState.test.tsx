import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { OfflineIcon, WarningIcon } from '../icons';
import { ErrorState } from './ErrorState';

const TITLE = 'No podemos cargar las estaciones';
const BODY = 'El servicio de BiciMAD no está respondiendo.';
const FOOTER = 'Volveremos a intentarlo solos en 30 s.';

function noop() {}

// Promise.withResolvers is ES2024; the project targets ES2022.
function pendingRetry() {
  let resolve: () => void = noop;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function renderErrorState(onAction: () => unknown = noop) {
  return render(
    <ErrorState
      tone="error"
      icon={WarningIcon}
      title={TITLE}
      body={BODY}
      action={{ label: 'Reintentar', onAction }}
      footer={FOOTER}
    />,
  );
}

describe('ErrorState', () => {
  it('announces the title, as a level 2 heading, and the body as an alert', () => {
    renderErrorState();

    const alert = screen.getByRole('alert');
    expect(alert).toContainElement(screen.getByRole('heading', { level: 2, name: TITLE }));
    expect(alert).toHaveTextContent(BODY);
  });

  it('keeps the footer out of the alert and of any live region, so it is not read every second', () => {
    renderErrorState();

    const footer = screen.getByText(FOOTER);
    expect(screen.getByRole('alert')).not.toContainElement(footer);
    expect(footer).toHaveAttribute('aria-live', 'off');
    expect(footer.closest('[role="alert"], [role="status"], [aria-live="polite"]')).toBeNull();
  });

  it('runs its action', async () => {
    const onAction = vi.fn<() => void>();
    renderErrorState(onAction);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('keeps the action busy until its promise settles, and ignores clicks meanwhile', async () => {
    const { promise, resolve } = pendingRetry();
    const onAction = vi.fn<() => Promise<void>>(() => promise);
    renderErrorState(onAction);
    const button = screen.getByRole('button', { name: 'Reintentar' });

    await userEvent.click(button);
    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeEnabled();
    expect(onAction).toHaveBeenCalledOnce();

    await act(async () => resolve());
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  it('makes the action a 48 px primary button', () => {
    renderErrorState();

    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveClass(
      'min-h-12',
      'bg-primary',
    );
  });

  it('renders neither button nor footer without them', () => {
    const { container } = render(
      <ErrorState tone="neutral" icon={OfflineIcon} title="Sin conexión a internet" body={BODY} />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live="off"]')).toBeNull();
  });

  it.each([
    { tone: 'error', circle: 'bg-notice-error' },
    { tone: 'neutral', circle: 'bg-chip' },
  ] as const)('draws the $tone icon in a $circle circle', ({ tone, circle }) => {
    const { container } = render(
      <ErrorState tone={tone} icon={WarningIcon} title={TITLE} body={BODY} />,
    );

    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.parentElement).toHaveClass('rounded-full', circle);
  });

  it('has no axe violations', async () => {
    const { container } = renderErrorState();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
