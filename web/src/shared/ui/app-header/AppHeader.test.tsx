import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { AppHeader } from './AppHeader';

function noop() {}

// Promise.withResolvers is ES2024; the project targets ES2022.
function pendingRefresh() {
  let resolve: () => void = noop;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('AppHeader', () => {
  it('shows the title as the page heading', () => {
    render(<AppHeader title="Panel de ejemplo" />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Panel de ejemplo' })).toBeVisible();
  });

  it('shows the subtitle under the title', () => {
    render(<AppHeader title="Panel" subtitle="Subtítulo" />);

    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });

  it('has no subtitle unless it is given', () => {
    const { container } = render(<AppHeader title="Panel" />);

    expect(container.querySelector('p')).toBeNull();
  });

  it('draws the logo as a decorative icon in front of the title', () => {
    const { container } = render(<AppHeader title="Panel" logo="clock" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg path')).toHaveAttribute('d', ICON_DRAWINGS.clock.paths[0]);
  });

  it('has no logo unless it is given', () => {
    const { container } = render(<AppHeader title="Panel" />);

    expect(container.querySelector('svg')).toBeNull();
  });

  it('states its status with the given tone', () => {
    render(<AppHeader title="Panel" statusText="Datos de hace 6 minutos" statusTone="warning" />);

    expect(screen.getByText('Datos de hace 6 minutos')).toHaveClass('text-tone-warning-label');
  });

  it('has no refresh button by default', () => {
    render(<AppHeader title="Panel" statusText="Actualizado" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('refreshes with its label and calls onRefresh', async () => {
    const onRefresh = vi.fn<() => void>();
    render(<AppHeader title="Panel" showRefresh refreshLabel="Reintentar" onRefresh={onRefresh} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('labels the refresh button «Actualizar» by default', () => {
    render(<AppHeader title="Panel" showRefresh onRefresh={noop} />);

    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
  });

  it('stays busy until the refresh settles', async () => {
    const { promise, resolve } = pendingRefresh();
    render(<AppHeader title="Panel" showRefresh onRefresh={() => promise} />);
    const button = screen.getByRole('button', { name: 'Actualizar' });

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');

    await act(async () => resolve());
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('has no axe violations with every part shown', async () => {
    const { container } = render(
      <AppHeader
        title="Panel"
        subtitle="Subtítulo"
        logo="clock"
        statusText="Actualizado"
        showRefresh
        onRefresh={noop}
      />,
    );

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    expect(within(screen.getByRole('banner')).getByRole('button')).toBeInTheDocument();
  });
});
