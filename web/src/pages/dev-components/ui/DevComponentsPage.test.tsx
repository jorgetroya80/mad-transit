import { render, screen, within } from '@testing-library/react';
import { ICON_NAMES, ICON_SIZES } from '@/shared/ui';
import { expectNoAxeViolations } from '../../../../test/axe';
import { DevComponentsPage } from './DevComponentsPage';

describe('DevComponentsPage', () => {
  it('passes axe with every piece on the page', async () => {
    const { container } = render(<DevComponentsPage />);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it('shows a swatch for every tone token', () => {
    render(<DevComponentsPage />);
    const tones = screen.getByRole('region', { name: 'Tonos' });

    expect(within(tones).getByText('tone-success-soft')).toBeInTheDocument();
    expect(within(tones).getByText('tone-warning-dot')).toBeInTheDocument();
    expect(within(tones).getByText('tone-inverse-icon')).toBeInTheDocument();
  });

  it.each(ICON_NAMES)('shows %s at every size', (name) => {
    render(<DevComponentsPage />);
    const icon = screen.getByRole('listitem', { name });

    expect(icon.querySelectorAll('svg')).toHaveLength(ICON_SIZES.length);
  });

  it('shows every Button look in its three states and the three sizes', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'Button' });

    expect(within(section).getAllByRole('button', { name: 'Reintentar' })).toHaveLength(10);
    expect(within(section).getAllByRole('button', { name: 'Ver horarios' })).toHaveLength(3);
    expect(within(section).getByRole('button', { name: 'Activar' })).toHaveClass('h-10');
  });

  it('shows the IconButton toggled on and off under the same name', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'IconButton' });
    const stars = within(section).getAllByRole('button', { name: 'Favorita' });

    expect(stars.map((star) => star.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
      'true',
    ]);
    expect(within(section).getByTitle('Quitar de favoritas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows every SegmentedControl variant with its chosen option pressed', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'SegmentedControl' });
    const services = within(section).getAllByRole('group', { name: 'Servicio' });
    const needs = within(section).getAllByRole('group', { name: '¿Qué quieres hacer?' });

    expect(services).toHaveLength(6);
    expect(needs).toHaveLength(6);
    expect(within(section).getAllByRole('group', { name: 'Sentido' })).toHaveLength(2);
    expect(
      within(needs[0] as HTMLElement).getByRole('button', { name: 'Sacar bici' }),
    ).toHaveAccessibleDescription('Bicis disponibles');
  });

  it('shows the SearchField for stations and for stops, with the stop error', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'SearchField' });

    expect(within(section).getAllByRole('searchbox', { name: 'Buscar estación' })).toHaveLength(7);
    const stops = within(section).getAllByRole('searchbox', { name: 'Buscar parada por número' });
    expect(stops.map((stop) => stop.getAttribute('inputmode'))).toEqual(['numeric', 'numeric']);
    expect(stops[1]).toHaveAccessibleDescription('El número de parada tiene de 1 a 4 cifras.');
  });

  it('shows every Banner tone, the bar and the action states, with one live region', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'Banner' });
    const actions = within(section).getAllByRole('button', { name: 'Usar mi ubicación' });

    expect(within(section).getAllByText(/Sin conexión a internet\./)).toHaveLength(3);
    expect(actions.map((action) => action.getAttribute('aria-busy'))).toEqual([
      null,
      null,
      'true',
      null,
    ]);
    expect(actions[3]).toBeDisabled();
    expect(within(section).getAllByRole('status')).toHaveLength(1);
    expect(within(section).queryByRole('alert')).toBeNull();
  });

  it('shows every EmptyState tone and size for both domains, with one live region', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'EmptyState' });

    expect(
      within(section).getAllByRole('heading', { name: 'No podemos cargar las estaciones' }),
    ).toHaveLength(5);
    expect(
      within(section).getByRole('heading', { name: 'No existe la parada 9999' }),
    ).toHaveProperty('tagName', 'H3');
    expect(within(section).getAllByRole('status')).toHaveLength(1);
    expect(within(section).queryByRole('alert')).toBeNull();
  });

  it('shows every StatusText tone and size, with one live region', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'StatusText' });

    expect(within(section).getAllByText('Actualizado hace 30 s')).toHaveLength(3);
    expect(within(section).getByText('Llegadas no disponibles')).toBeInTheDocument();
    expect(within(section).getAllByRole('status')).toHaveLength(1);
  });

  it('says why only one specimen of each notice is live', () => {
    render(<DevComponentsPage />);

    expect(screen.getAllByText(/Solo un ejemplo es región viva/)).toHaveLength(3);
  });
});
