import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SheetSnap } from '@/shared/ui';
import { AppLayout } from './AppLayout';

function renderLayout(onPanelSnapChange = vi.fn<(snap: SheetSnap) => void>()) {
  return render(
    <AppLayout
      title="Mad Transit"
      map={<div data-testid="map" />}
      panelLabel="Estaciones"
      panel={<p>Contenido del panel</p>}
      panelSnap="half"
      onPanelSnapChange={onPanelSnapChange}
      panelNextSnap={{ peek: 'half', half: 'full', full: 'half' }}
      panelHandleLabel="Ampliar lista"
    />,
  );
}

describe('AppLayout', () => {
  it('names the page inside the main landmark', () => {
    renderLayout();

    expect(
      within(screen.getByRole('main')).getByRole('heading', { level: 1, name: 'Mad Transit' }),
    ).toBeInTheDocument();
  });

  it('renders the map inside the main landmark', () => {
    renderLayout();

    expect(within(screen.getByRole('main')).getByTestId('map')).toBeInTheDocument();
  });

  it('renders the panel once, inside a bottom sheet in the main landmark below md', () => {
    renderLayout();

    const sheet = within(screen.getByRole('main')).getByRole('region', { name: 'Estaciones' });
    expect(within(sheet).getByText('Contenido del panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ampliar lista' })).toBeInTheDocument();
    expect(screen.getAllByText('Contenido del panel')).toHaveLength(1);
  });

  it('fills the dynamic viewport height', () => {
    renderLayout();

    // Column below md, so the bottom sheet peek strip sits under the map instead of over it.
    expect(screen.getByRole('main')).toHaveClass('flex', 'h-dvh', 'flex-col');
  });

  it('lets the page control the bottom sheet below md', async () => {
    const user = userEvent.setup();
    const onPanelSnapChange = vi.fn<(snap: SheetSnap) => void>();
    renderLayout(onPanelSnapChange);
    const handle = screen.getByRole('button', { name: 'Ampliar lista' });

    expect(handle).toHaveAttribute('aria-expanded', 'true');

    await user.click(handle);
    expect(onPanelSnapChange).toHaveBeenCalledExactlyOnceWith('full');
    expect(handle).toHaveAttribute('aria-expanded', 'true');
  });
});
