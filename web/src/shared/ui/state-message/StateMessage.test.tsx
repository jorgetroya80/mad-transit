import { render, screen } from '@testing-library/react';
import { StateMessage } from './StateMessage';

describe('StateMessage', () => {
  it('announces an empty state as a status', () => {
    render(
      <StateMessage variant="empty" title="Sin estaciones">
        Las estaciones llegan pronto
      </StateMessage>,
    );

    const message = screen.getByRole('status');
    expect(message).toHaveTextContent('Sin estaciones');
    expect(message).toHaveTextContent('Las estaciones llegan pronto');
    expect(message).not.toHaveAttribute('aria-busy');
  });

  it('announces an error as an alert', () => {
    render(<StateMessage variant="error" title="No se pudieron cargar los datos" />);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los datos');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('frames an error like the status banners: tinted, thin border all round and an icon', () => {
    render(<StateMessage variant="error" title="No se pudieron cargar los datos" />);

    const message = screen.getByRole('alert');
    expect(message).toHaveClass('border', 'bg-notice-error', 'text-notice-error-foreground');
    expect(message).not.toHaveClass('border-l-4');
    expect(message.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces loading as a busy status', () => {
    render(<StateMessage variant="loading" title="Cargando estaciones" />);

    const message = screen.getByRole('status');
    expect(message).toHaveTextContent('Cargando estaciones');
    expect(message).toHaveAttribute('aria-busy', 'true');
  });
});
