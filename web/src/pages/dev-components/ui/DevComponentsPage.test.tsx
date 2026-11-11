import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('shows the Banner floating over the mobile map', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'Banner' });

    expect(within(section).getByText('info · float')).toBeInTheDocument();
    expect(within(section).getByText('warning · float')).toBeInTheDocument();
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

  it('shows every CountBadge tone at both sizes, loading, and the one that speaks', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'CountBadge' });

    expect(within(section).getAllByText('0')).toHaveLength(2);
    expect(within(section).getAllByText('0')[0]?.parentElement).toHaveClass('border-dashed');
    expect(within(section).getByText('2 avisos sin leer')).toHaveClass('sr-only');
    expect(within(section).getAllByText(/^Cargando/)).toHaveLength(2);
  });

  it('shows the day line and the night line, which says what it is', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'Tag' });

    expect(within(section).getAllByText('N16')).toHaveLength(2);
    expect(within(section).getAllByText('línea nocturna N16')).toHaveLength(2);
    expect(within(section).getByText('Líneas:')).toHaveClass('sr-only');
  });

  it('shows every StatTile tone for both domains, with its status word and loading', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'StatTile' });

    expect(within(section).getAllByText('bicis disponibles').length).toBeGreaterThan(1);
    expect(within(section).getAllByText('anclajes libres').length).toBeGreaterThan(1);
    expect(within(section).getByText('minutos para el 27')).toBeInTheDocument();
    expect(within(section).getByText('Sin confirmar')).toHaveClass('text-tone-muted-label');
  });

  it('shows the map legend with a solid «Vacía» and the stops legend with squares', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'Legend' });
    const [map, stacked] = within(section).getAllByRole('list', { name: 'Leyenda del mapa' });
    const stops = within(section).getByRole('list', { name: 'Leyenda de paradas' });

    expect(within(map as HTMLElement).getByText('Vacía').firstElementChild).toHaveClass(
      'border-solid',
    );
    expect(within(stacked as HTMLElement).getByText('Vacía').firstElementChild).toHaveClass(
      'border-dashed',
    );
    expect(within(stops).getByText('Parada elegida').firstElementChild).toHaveClass('rounded');
  });

  it('shows the rows for both domains, inside list items, with no nested buttons', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'ListItem' });
    const stations = within(section).getAllByRole('button', {
      name: 'Estación 33, Puerta del Sol, 57 metros, 3 bicis',
    });
    const showOnMap = within(section).getAllByRole('button', {
      name: 'Ver en el mapa el autobús de la línea 51',
    });

    expect(stations).toHaveLength(6);
    expect(stations.map((row) => row.getAttribute('aria-current'))).toEqual([
      null,
      'true',
      null,
      null,
      null,
      'true',
    ]);
    expect(stations[3]).toHaveAccessibleDescription('Cargando disponibilidad');
    expect(
      within(section)
        .getByRole('button', {
          name: 'Parada 1211, Alcalá-Sevilla, 140 metros, líneas 5, 15 y 20',
        })
        .closest('li'),
    ).not.toBeNull();
    expect(showOnMap.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
    ]);
    expect(section.querySelector('button button')).toBeNull();
  });

  it('toggles the arrival row button like the real one', async () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'ListItem' });
    const [showOnMap] = within(section).getAllByRole('button', {
      name: 'Ver en el mapa el autobús de la línea 51',
    });

    await userEvent.click(showOnMap as HTMLElement);

    expect(showOnMap).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the Disclosure open, closed, controlled and small', () => {
    render(<DevComponentsPage />);
    const section = screen.getByRole('region', { name: 'Disclosure' });
    const toggles = within(section).getAllByRole('button', { name: /^Favoritas · \d$/ });

    expect(toggles.map((toggle) => toggle.getAttribute('aria-expanded'))).toEqual([
      'true',
      'false',
      'true',
      'true',
      'false',
    ]);
    expect(within(section).getByRole('button', { name: 'Horario de hoy' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('says why only one specimen of each notice is live', () => {
    render(<DevComponentsPage />);

    expect(screen.getAllByText(/Solo un ejemplo es región viva/)).toHaveLength(3);
  });
});
