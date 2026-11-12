import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import type { SearchSource } from '../model/types';
import { SearchByNumber } from './SearchByNumber';

function bicimadSource(overrides: Partial<SearchSource> = {}): SearchSource {
  return {
    id: 'bicimad',
    label: 'BiciMAD',
    itemLabel: 'estación',
    itemLabelPlural: 'estaciones',
    items: [
      { number: '10', title: 'Tirso de Molina' },
      { number: '1a', title: 'Puerta del Sol A', subtitle: 'Puerta del Sol nº 1' },
      { number: '1b', title: 'Puerta del Sol B' },
      { number: '25A', title: 'Fuencarral' },
    ],
    status: 'ready',
    onSelect: vi.fn<(number: string) => void>(),
    ...overrides,
  };
}

function busSource(overrides: Partial<SearchSource> = {}): SearchSource {
  return {
    id: 'bus',
    label: 'Autobús',
    itemLabel: 'parada',
    itemLabelPlural: 'paradas',
    items: [
      { number: '1234', title: 'Gran Vía' },
      { number: '12', title: 'Atocha' },
    ],
    status: 'ready',
    onSelect: vi.fn<(number: string) => void>(),
    ...overrides,
  };
}

function searchBox() {
  return screen.getByRole('searchbox');
}

function resultButtons() {
  return within(screen.getByRole('list')).getAllByRole('button');
}

function resultNumbers() {
  return screen
    .queryAllByRole('listitem')
    .map((item) => item.querySelector('button')?.dataset.number);
}

function status() {
  return screen.getByRole('status');
}

function clearButton() {
  return screen.queryByRole('button', { name: 'Borrar búsqueda' });
}

describe('SearchByNumber', () => {
  describe('with one source', () => {
    it('shows no service selector and labels the box with the item label', () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      expect(screen.queryByRole('group')).not.toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      expect(screen.getByRole('searchbox', { name: 'Buscar estación' })).toBeVisible();
      expect(searchBox()).toHaveAttribute('autocomplete', 'off');
      expect(searchBox()).toHaveAttribute('inputmode', 'text');
    });

    it('is a 48 px box with its label and help shown', () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      expect(searchBox()).toHaveClass('h-12', 'rounded-control');
      expect(screen.getByText('Buscar estación')).not.toHaveClass('sr-only');
      expect(screen.getByText('Busca por número de estación.')).not.toHaveClass('sr-only');
    });

    it('describes the box with how to search', () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      expect(searchBox()).toHaveAccessibleDescription('Busca por número de estación.');
    });

    it('starts with no results and no message', () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(status()).toBeEmptyDOMElement();
    });

    it('lists matches by number as buttons named by number, title and subtitle', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      await userEvent.type(searchBox(), '1');

      expect(resultNumbers()).toEqual(['1a', '1b', '10']);
      expect(
        screen.getByRole('button', { name: '1a, Puerta del Sol A, Puerta del Sol nº 1' }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: '10, Tirso de Molina' })).toBeVisible();
    });

    it('announces how many results there are', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      await userEvent.type(searchBox(), '1');
      expect(status()).toHaveTextContent('3 estaciones');

      await userEvent.type(searchBox(), 'a');
      expect(status()).toHaveTextContent('1 estación');
    });

    it('does not search by name', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      await userEvent.type(searchBox(), 'sol');

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(screen.getByText('No hay ninguna estación «sol»')).toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    it('moves the focus with the arrows, from the box through the results and back', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.type(searchBox(), '1');
      const [first, second, third] = resultButtons();

      await userEvent.keyboard('{ArrowDown}');
      expect(first).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(third).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');
      expect(third).toHaveFocus();

      await userEvent.keyboard('{ArrowUp}');
      expect(second).toHaveFocus();

      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      expect(searchBox()).toHaveFocus();
      expect(searchBox()).toHaveValue('1');
    });

    it('ignores ArrowDown in the box without results', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.type(searchBox(), 'sol');

      await userEvent.keyboard('{ArrowDown}');

      expect(searchBox()).toHaveFocus();
    });

    it('goes back to the box with Escape, keeping the text', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.type(searchBox(), '1');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');

      await userEvent.keyboard('{Escape}');

      expect(searchBox()).toHaveFocus();
      expect(searchBox()).toHaveValue('1');
      expect(resultNumbers()).toEqual(['1a', '1b', '10']);
    });

    it('clears the box with Escape in the box', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.type(searchBox(), '1');

      await userEvent.keyboard('{Escape}');

      expect(searchBox()).toHaveFocus();
      expect(searchBox()).toHaveValue('');
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('lets Escape through when the box is already empty', async () => {
      const prevented: boolean[] = [];
      const recordEscape = (event: KeyboardEvent) => prevented.push(event.defaultPrevented);
      document.addEventListener('keydown', recordEscape);
      render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.click(searchBox());

      await userEvent.keyboard('{Escape}');
      document.removeEventListener('keydown', recordEscape);

      expect(prevented).toEqual([false]);
    });

    it('chooses the focused result with Enter and clears the box', async () => {
      const source = bicimadSource();
      render(<SearchByNumber sources={[source]} />);
      await userEvent.type(searchBox(), '1');

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(source.onSelect).toHaveBeenCalledExactlyOnceWith('1b');
      expect(searchBox()).toHaveValue('');
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('chooses the exact match with Enter in the box', async () => {
      const source = bicimadSource();
      render(<SearchByNumber sources={[source]} />);

      await userEvent.type(searchBox(), ' 25a {Enter}');

      expect(source.onSelect).toHaveBeenCalledExactlyOnceWith('25A');
      expect(searchBox()).toHaveValue('');
    });

    it('ignores Enter in the box without an exact match', async () => {
      const source = bicimadSource();
      render(<SearchByNumber sources={[source]} />);

      await userEvent.type(searchBox(), '1{Enter}');

      expect(source.onSelect).not.toHaveBeenCalled();
      expect(searchBox()).toHaveValue('1');
    });

    it('ignores other keys on a result', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.type(searchBox(), '1{ArrowDown}');

      await userEvent.keyboard('{ArrowLeft}');

      expect(resultButtons()[0]).toHaveFocus();
    });
  });

  describe('pointer', () => {
    it('chooses a result on click and clears the box', async () => {
      const source = bicimadSource();
      render(<SearchByNumber sources={[source]} />);
      await userEvent.type(searchBox(), '1');

      await userEvent.click(screen.getByRole('button', { name: /Puerta del Sol B/ }));

      expect(source.onSelect).toHaveBeenCalledExactlyOnceWith('1b');
      expect(searchBox()).toHaveValue('');
    });

    // The source decides where the focus goes (the page opens the detail and focuses its title);
    // pulling it back to the box would open the on-screen keyboard on mobile.
    it.each([
      {
        how: 'click',
        choose: () => userEvent.click(screen.getByRole('button', { name: /Puerta del Sol B/ })),
      },
      {
        how: 'Enter on a result',
        choose: () => userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}'),
      },
      { how: 'Enter on an exact match', choose: () => userEvent.keyboard('b{Enter}') },
    ])('leaves the focus where the source put it ($how)', async ({ choose }) => {
      const source = bicimadSource({
        onSelect: vi.fn<SearchSource['onSelect']>(() =>
          screen.getByRole('button', { name: 'Detalle' }).focus(),
        ),
      });
      render(
        <>
          <SearchByNumber sources={[source]} />
          <button type="button">Detalle</button>
        </>,
      );
      await userEvent.type(searchBox(), '1');

      await choose();

      expect(screen.getByRole('button', { name: 'Detalle' })).toHaveFocus();
    });
  });

  describe('clear button', () => {
    it('appears only when the box has text', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);
      expect(clearButton()).not.toBeInTheDocument();

      await userEvent.type(searchBox(), '1');

      expect(clearButton()).toBeVisible();
    });

    it('clears the box and puts the focus back in it', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.type(searchBox(), '1');

      await userEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));

      expect(searchBox()).toHaveValue('');
      expect(searchBox()).toHaveFocus();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(clearButton()).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it.each([
      { state: 'without results', query: '' },
      { state: 'with results', query: '1' },
    ])('has no axe violations $state', async ({ query }) => {
      const { container } = render(<SearchByNumber sources={[bicimadSource()]} />);
      if (query) await userEvent.type(searchBox(), query);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('states', () => {
    it('swaps the magnifier for a spinner while a typed search waits for the data', async () => {
      const { container } = render(
        <SearchByNumber sources={[bicimadSource({ items: [], status: 'loading' })]} />,
      );

      await userEvent.type(searchBox(), '1');

      expect(container.querySelector('svg')).toHaveClass('animate-spin');
    });

    it('keeps the magnifier while loading with an empty box', () => {
      const { container } = render(
        <SearchByNumber sources={[bicimadSource({ items: [], status: 'loading' })]} />,
      );

      expect(container.querySelector('svg')).not.toHaveClass('animate-spin');
    });

    it('announces loading with the plural item label', async () => {
      render(<SearchByNumber sources={[bicimadSource({ items: [], status: 'loading' })]} />);

      await userEvent.type(searchBox(), '1');

      expect(status()).toHaveTextContent('Cargando estaciones…');
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('announces an error with the plural item label', async () => {
      render(<SearchByNumber sources={[bicimadSource({ items: [], status: 'error' })]} />);

      await userEvent.type(searchBox(), '1');

      expect(status()).toHaveTextContent('No se pudieron cargar las estaciones');
    });

    it('announces no results with the query as typed, trimmed', async () => {
      render(<SearchByNumber sources={[bicimadSource()]} />);

      await userEvent.type(searchBox(), ' 99Z ');

      expect(screen.getByText('No hay ninguna estación «99Z»').closest('output')).toHaveRole(
        'status',
      );
    });

    it('shows no message for a blank query, even while loading', async () => {
      render(<SearchByNumber sources={[bicimadSource({ status: 'loading' })]} />);

      await userEvent.type(searchBox(), '   ');

      expect(status()).toBeEmptyDOMElement();
    });
  });

  describe('no results', () => {
    const SUGGESTION = { number: '33', title: 'Puerta del Sol' };
    const MESSAGE = 'No hay ninguna estación «99Z» Revisa el número que aparece en la estación.';

    function noResultsMessage() {
      return screen.getByText('No hay ninguna estación «99Z»').closest('output');
    }

    async function searchNothing(overrides: Partial<SearchSource> = {}) {
      const source = bicimadSource({ suggestion: SUGGESTION, ...overrides });
      const view = render(<SearchByNumber sources={[source]} />);
      await userEvent.type(searchBox(), ' 99Z ');
      return { source, ...view };
    }

    it('says so with the query as typed, trimmed, in a live region (SC5)', async () => {
      await searchNothing();

      expect(noResultsMessage()).toHaveRole('status');
      expect(noResultsMessage()).toHaveTextContent(MESSAGE);
      expect(screen.getByRole('heading', { level: 3, name: 'Prueba con' })).toBeInTheDocument();
    });

    it('heads the message with the query and offers the suggestions under it', async () => {
      await searchNothing();
      const title = screen.getByRole('heading', {
        level: 2,
        name: 'No hay ninguna estación «99Z»',
      });

      expect(noResultsMessage()).toContainElement(title);
      expect(title.compareDocumentPosition(screen.getByRole('heading', { level: 3 }))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('announces it once: in its block, not in the results count', async () => {
      await searchNothing();

      const announced = screen.getAllByRole('status').map((region) => region.textContent);
      expect(announced.filter((text) => text?.includes('99Z'))).toHaveLength(1);
    });

    it('keeps the suggestions out of the live region', async () => {
      await searchNothing();

      expect(noResultsMessage()).not.toContainElement(
        screen.getByRole('button', { name: 'Ver estaciones cercanas' }),
      );
    });

    it('describes the box with the help and the message', async () => {
      await searchNothing();

      expect(searchBox()).toHaveAccessibleDescription(`Busca por número de estación. ${MESSAGE}`);
    });

    it('opens the suggestion like a result, clearing the box', async () => {
      const { source } = await searchNothing();

      await userEvent.click(screen.getByRole('button', { name: '33 · Puerta del Sol' }));

      expect(source.onSelect).toHaveBeenCalledExactlyOnceWith('33');
      expect(searchBox()).toHaveValue('');
    });

    it('clears the box and keeps the focus in it with «Ver estaciones cercanas»', async () => {
      await searchNothing();

      await userEvent.click(screen.getByRole('button', { name: 'Ver estaciones cercanas' }));

      expect(searchBox()).toHaveValue('');
      expect(searchBox()).toHaveFocus();
      expect(screen.queryByText(/No hay ninguna/)).not.toBeInTheDocument();
    });

    it('offers only the nearby stations without a suggestion', async () => {
      await searchNothing({ suggestion: undefined });

      expect(screen.queryByRole('button', { name: /·/ })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ver estaciones cercanas' })).toBeInTheDocument();
    });

    it('reaches both suggestions with Tab after the box', async () => {
      await searchNothing();

      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Borrar búsqueda' })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: '33 · Puerta del Sol' })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Ver estaciones cercanas' })).toHaveFocus();
    });

    it.each(['loading', 'error'] as const)('shows nothing of it while %s', async (state) => {
      await searchNothing({ items: [], status: state });

      expect(screen.queryByText(/No hay ninguna/)).not.toBeInTheDocument();
    });

    it.each(['inline', 'floating'] as const)('has no axe violations %s', async (variant) => {
      const source = bicimadSource({ suggestion: SUGGESTION });
      const { container } = render(<SearchByNumber sources={[source]} variant={variant} />);
      await userEvent.type(searchBox(), '99Z');

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('unavailable source', () => {
    const UNAVAILABLE = 'No disponible hasta recuperar los datos';

    function unavailableSource() {
      return bicimadSource({ items: [], status: 'error', unavailableText: UNAVAILABLE });
    }

    it('disables the box and says why in it, instead of the help', () => {
      render(<SearchByNumber sources={[unavailableSource()]} />);

      expect(searchBox()).toBeDisabled();
      expect(searchBox()).toHaveAttribute('placeholder', UNAVAILABLE);
      expect(searchBox()).toHaveAccessibleDescription(UNAVAILABLE);
      expect(screen.queryByText('Busca por número de estación.')).not.toBeInTheDocument();
    });

    it('drops the clear button when the source stops being searchable', async () => {
      const { rerender } = render(<SearchByNumber sources={[bicimadSource()]} />);
      await userEvent.type(searchBox(), '1');

      rerender(<SearchByNumber sources={[unavailableSource()]} />);

      expect(clearButton()).not.toBeInTheDocument();
    });

    it('has no axe violations', async () => {
      const { container } = render(<SearchByNumber sources={[unavailableSource()]} />);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });

  it('shows the source placeholder in a searchable box, keeping the help', async () => {
    const placeholder = 'Busca entre las estaciones guardadas';
    render(<SearchByNumber sources={[bicimadSource({ placeholder })]} />);

    expect(searchBox()).toBeEnabled();
    expect(searchBox()).toHaveAttribute('placeholder', placeholder);
    expect(searchBox()).toHaveAccessibleDescription('Busca por número de estación.');
    await userEvent.type(searchBox(), '1a');
    expect(resultNumbers()).toEqual(['1a']);
  });

  describe('with two sources', () => {
    it('shows the service selector with the first source chosen', () => {
      render(<SearchByNumber sources={[bicimadSource(), busSource()]} />);

      expect(screen.getByRole('group', { name: 'Servicio' })).toBeVisible();
      expect(screen.getByRole('radio', { name: 'BiciMAD' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Autobús' })).not.toBeChecked();
      expect(searchBox()).toHaveAccessibleName('Buscar estación');
    });

    it('searches only in the chosen source and keeps the text when switching', async () => {
      const bicimad = bicimadSource();
      const bus = busSource();
      render(<SearchByNumber sources={[bicimad, bus]} />);
      await userEvent.type(searchBox(), '1');
      expect(resultNumbers()).toEqual(['1a', '1b', '10']);

      await userEvent.click(screen.getByRole('radio', { name: 'Autobús' }));

      expect(searchBox()).toHaveAccessibleName('Buscar parada');
      expect(searchBox()).toHaveValue('1');
      expect(resultNumbers()).toEqual(['12', '1234']);
      expect(status()).toHaveTextContent('2 paradas');

      await userEvent.click(screen.getByRole('button', { name: '12, Atocha' }));

      expect(bus.onSelect).toHaveBeenCalledExactlyOnceWith('12');
      expect(bicimad.onSelect).not.toHaveBeenCalled();
    });

    it('uses the chosen source labels in the messages', async () => {
      render(<SearchByNumber sources={[bicimadSource(), busSource({ status: 'error' })]} />);

      await userEvent.click(screen.getByRole('radio', { name: 'Autobús' }));
      await userEvent.type(searchBox(), '1');

      expect(status()).toHaveTextContent('No se pudieron cargar las paradas');
    });
  });
});
