import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, createRef, type ReactNode, useId, useState } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { Banner } from '../banner';
import { IconButton } from '../icon-button';
import { ListItem } from '../list-item';
import { SearchField } from '../search-field';
import { StatTile } from '../stat-tile';
import { StatusText } from '../status-text';
import { Tag } from '../tag';
import * as cardModule from '.';
import { Card } from '.';

type CardProps = ComponentProps<typeof Card>;
type HeaderProps = ComponentProps<typeof Card.Header>;
type BodyProps = ComponentProps<typeof Card.Body>;

type CardOptions = Partial<Omit<CardProps, 'titleId' | 'children'>> & {
  header?: Partial<Omit<HeaderProps, 'titleId'>>;
  body?: ReactNode;
};

const STATION = { meta: 'Estación 33 · 57 m', title: 'Puerta del Sol' } as const;
const STOP = { meta: 'Parada 48 · a 45 m', title: 'Puerta del Sol' } as const;

function ignorePress() {}

const CLOSE = (
  <IconButton label="Cerrar la ficha de la estación" icon="close" onClick={ignorePress} />
);
const FAVORITE = (
  <IconButton
    label="Favorita"
    icon="star"
    pressedIcon="star-filled"
    iconTone="primary"
    pressed={false}
    tooltip="Añadir a favoritas"
    onClick={ignorePress}
  />
);
const BACK = <IconButton label="Volver a la lista" icon="chevron-left" onClick={ignorePress} />;

const TILES = (
  <div className="grid grid-cols-2 gap-2">
    <StatTile value="3" label="bicis disponibles" tone="warning" />
    <StatTile value="21" label="anclajes libres" tone="success" />
  </div>
);

const ARRIVALS = (
  <ul>
    <li>
      <ListItem leading={<Tag label="51" />} title="ATOCHA" trailing="2 min" />
    </li>
    <li>
      <ListItem leading={<Tag label="53" />} title="PLAZA DE ESPAÑA" trailing="7 min" />
    </li>
  </ul>
);

function TestCard({ header = {}, body = TILES, ...props }: CardOptions) {
  const titleId = useId();
  return (
    <Card titleId={titleId} {...props}>
      <Card.Header
        titleId={titleId}
        {...STATION}
        cornerActions={CLOSE}
        titleAction={FAVORITE}
        {...header}
      />
      <Card.Body>{body}</Card.Body>
      <Card.Footer>
        <StatusText text="Actualizado hace 30 s" tone="neutral" showDot={false} size="sm" />
      </Card.Footer>
    </Card>
  );
}

function renderCard(options: CardOptions = {}) {
  const { container } = render(<TestCard {...options} />);
  const root = container.firstElementChild;
  if (!(root instanceof HTMLElement)) throw new Error('Card rendered nothing');
  return { root, container };
}

function title() {
  return screen.getByRole('heading', { name: 'Puerta del Sol' });
}

function SearchCard({ onEscape }: { onEscape: () => void }) {
  const [query, setQuery] = useState('Sol');
  return (
    <TestCard
      onEscape={onEscape}
      body={
        <SearchField
          label="Buscar parada por número"
          clearLabel="Borrar búsqueda"
          value={query}
          onChange={setQuery}
        />
      }
    />
  );
}

describe('Card', () => {
  describe('compound API', () => {
    it('hangs Header, Body and Footer from Card', () => {
      expect(Card.Header).toBeTypeOf('function');
      expect(Card.Body).toBeTypeOf('function');
      expect(Card.Footer).toBeTypeOf('function');
    });

    it('exports only Card', () => {
      expect(Object.keys(cardModule)).toEqual(['Card']);
    });

    it('requires the title and the id that names the card', () => {
      expectTypeOf<Pick<HeaderProps, 'title' | 'titleId'>>().toEqualTypeOf<{
        title: string;
        titleId: string;
      }>();
      expectTypeOf<Pick<CardProps, 'titleId'>>().toEqualTypeOf<{ titleId: string }>();
    });
  });

  describe('name', () => {
    it.each([STATION, STOP])('is a region named by its title, below «$meta»', async (texts) => {
      renderCard({ header: texts });

      const card = screen.getByRole('region', { name: texts.title });
      expect(within(card).getByText(texts.meta)).toBeInTheDocument();
      expect(card.tagName).toBe('SECTION');
    });

    it('can be an article, still named by its title', () => {
      renderCard({ as: 'article' });

      expect(screen.getByRole('article', { name: 'Puerta del Sol' })).toBeInTheDocument();
    });

    it('as a div is no landmark and takes no name', () => {
      const { root } = renderCard({ as: 'div' });

      expect(root.tagName).toBe('DIV');
      expect(root).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('Card.Header', () => {
    it.each<[HeaderProps['titleLevel'], string]>([
      [undefined, 'H2'],
      [3, 'H3'],
    ])('titles with titleLevel %s as an %s', (titleLevel, tag) => {
      renderCard({ header: { titleLevel } });

      expect(title().tagName).toBe(tag);
    });

    it('lets the title take the focus by code, without a ring and off the Tab order', async () => {
      renderCard();

      title().focus();
      expect(title()).toHaveFocus();
      expect(title()).toHaveAttribute('tabindex', '-1');
      expect(title()).toHaveClass('focus-visible:outline-none');

      await userEvent.tab();
      expect(title()).not.toHaveFocus();
    });

    it('hands the title element to titleRef, so a page can focus it', () => {
      const titleRef = createRef<HTMLHeadingElement>();
      renderCard({ header: { titleRef } });

      expect(titleRef.current).toBe(title());
      titleRef.current?.focus();
      expect(title()).toHaveFocus();
    });

    it('draws the meta in 13/600 fg-muted and the title in 18/700', () => {
      renderCard();

      expect(screen.getByText(STATION.meta)).toHaveClass(
        'text-meta',
        'font-semibold',
        'text-fg-muted',
      );
      expect(title()).toHaveClass('text-title', 'text-fg');
    });

    it('draws the title in 19/700 inside a flat card', () => {
      const { root } = renderCard({ elevation: 'flat' });

      expect(root).toHaveAttribute('data-elevation', 'flat');
      expect(title()).toHaveClass('group-data-[elevation=flat]/card:text-[1.1875rem]');
    });

    it('leaves the meta row out without meta or corner actions', () => {
      renderCard({ header: { meta: undefined, cornerActions: undefined } });

      expect(title().parentElement?.previousElementSibling).toBeNull();
    });

    it('pulls each action 10 px toward its corner', () => {
      renderCard({ header: { leadingAction: BACK } });

      const back = screen.getByRole('button', { name: 'Volver a la lista' });
      const close = screen.getByRole('button', { name: 'Cerrar la ficha de la estación' });
      expect(back.parentElement).toHaveClass('-ml-2.5');
      expect(close.parentElement?.parentElement).toHaveClass('-mt-2.5', '-mr-2.5');
      expect(title().parentElement).toHaveClass('-mr-2.5');
    });

    it('tabs through the leading action, the corner actions, the title action and the body', async () => {
      renderCard({
        header: { leadingAction: BACK },
        body: <button type="button">Reintentar</button>,
      });

      const order = [];
      for (let step = 0; step < 4; step += 1) {
        await userEvent.tab();
        order.push(
          document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent,
        );
      }

      expect(order).toEqual([
        'Volver a la lista',
        'Cerrar la ficha de la estación',
        'Favorita',
        'Reintentar',
      ]);
    });
  });

  describe('elevation', () => {
    it('floats by default: surface, subtle border, float shadow and radius, 18 px padding', () => {
      const { root } = renderCard();

      expect(root).toHaveClass(
        'bg-surface',
        'border',
        'border-line-subtle',
        'shadow-float',
        'rounded-float',
        'p-4.5',
        'gap-3.5',
      );
    });

    it('lies flat inside a panel: transparent, 0 × 16 px padding, no shadow or border', () => {
      const { root } = renderCard({ elevation: 'flat' });

      expect(root).toHaveClass('bg-transparent', 'px-4', 'gap-3.5');
      expect(root).not.toHaveClass('shadow-float', 'border');
    });
  });

  describe('Escape', () => {
    it.each(['Cerrar la ficha de la estación', 'Favorita', 'Reintentar'])(
      'calls onEscape from «%s»',
      async (name) => {
        const onEscape = vi.fn<() => void>();
        renderCard({ onEscape, body: <button type="button">Reintentar</button> });

        screen.getByRole('button', { name }).focus();
        await userEvent.keyboard('{Escape}');

        expect(onEscape).toHaveBeenCalledOnce();
      },
    );

    it('leaves the Escape to a search box that clears its text', async () => {
      const onEscape = vi.fn<() => void>();
      render(<SearchCard onEscape={onEscape} />);
      const box = screen.getByRole('searchbox', { name: 'Buscar parada por número' });

      await userEvent.click(box);
      await userEvent.keyboard('{Escape}');

      expect(box).toHaveValue('');
      expect(onEscape).not.toHaveBeenCalled();
    });

    it('calls onEscape from a search box with nothing to clear', async () => {
      const onEscape = vi.fn<() => void>();
      render(<SearchCard onEscape={onEscape} />);
      const box = screen.getByRole('searchbox', { name: 'Buscar parada por número' });

      await userEvent.click(box);
      await userEvent.keyboard('{Escape}{Escape}');

      expect(onEscape).toHaveBeenCalledOnce();
    });

    it('ignores Escape from outside the card', async () => {
      const onEscape = vi.fn<() => void>();
      render(
        <>
          <TestCard onEscape={onEscape} />
          <button type="button">Fuera</button>
        </>,
      );

      screen.getByRole('button', { name: 'Fuera' }).focus();
      await userEvent.keyboard('{Escape}');

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('traps no focus: Tab leaves the card after its last control', async () => {
      render(
        <>
          <TestCard onEscape={ignorePress} />
          <button type="button">Fuera</button>
        </>,
      );

      screen.getByRole('button', { name: 'Favorita' }).focus();
      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'Fuera' })).toHaveFocus();
    });
  });

  describe('Card.Body', () => {
    it('shows its content when not busy', () => {
      renderCard();

      expect(screen.getByText('bicis disponibles')).toBeInTheDocument();
      expect(screen.getByText('anclajes libres').closest('[aria-busy]')).toBeNull();
    });

    it('swaps the content for a Spinner, aria-busy and a hidden busyLabel', () => {
      const titleId = 'card-title';
      render(
        <Card titleId={titleId}>
          <Card.Header titleId={titleId} {...STOP} />
          <Card.Body busy busyLabel="Cargando las llegadas">
            {ARRIVALS}
          </Card.Body>
        </Card>,
      );

      const label = screen.getByText('Cargando las llegadas');
      expect(label).toHaveClass('sr-only');
      expect(label.parentElement).toHaveAttribute('aria-busy', 'true');
      expect(label.parentElement?.querySelector('svg')).toHaveClass('animate-spin');
      expect(screen.queryByText('ATOCHA')).toBeNull();
    });

    it('requires a busyLabel when busy', () => {
      expectTypeOf<{ children: ReactNode; busy: true }>().not.toExtend<BodyProps>();
      expectTypeOf<{ children: ReactNode; busy: boolean }>().not.toExtend<BodyProps>();
      expectTypeOf<{
        children: ReactNode;
        busy: boolean;
        busyLabel: string;
      }>().toExtend<BodyProps>();
      expectTypeOf<{ children: ReactNode }>().toExtend<BodyProps>();
    });

    it('draws nothing above the content by default', () => {
      renderCard({ body: ARRIVALS });

      expect(screen.getByRole('list').parentElement).not.toHaveClass('border-t');
    });

    it('draws a subtle line above the content when separated', () => {
      const titleId = 'card-title';
      render(
        <Card titleId={titleId}>
          <Card.Header titleId={titleId} {...STOP} />
          <Card.Body separated>{ARRIVALS}</Card.Body>
        </Card>,
      );

      expect(screen.getByRole('list').parentElement).toHaveClass(
        'border-t',
        'border-line-subtle',
        'pt-2',
      );
    });
  });

  describe('composition', () => {
    it('holds the arrivals of a stop as static rows with their line tag', () => {
      renderCard({ header: STOP, body: ARRIVALS });

      const card = screen.getByRole('region', { name: STOP.title });
      expect(within(card).getAllByRole('listitem')).toHaveLength(2);
      expect(within(card).getByText('51')).toBeInTheDocument();
      expect(within(card).queryAllByRole('button', { name: /ATOCHA/ })).toHaveLength(0);
    });

    it('holds a danger Banner with its retry action as the error state', () => {
      renderCard({
        body: (
          <Banner
            tone="danger"
            message="No se pudo cargar la estación."
            action={{ label: 'Reintentar', onClick: ignorePress }}
          />
        ),
      });

      expect(screen.getByText('No se pudo cargar la estación.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    });

    it('ends with its footer', () => {
      const { root } = renderCard();

      expect(root.lastElementChild).toHaveTextContent('Actualizado hace 30 s');
    });
  });

  describe('axe', () => {
    it.each<[string, CardOptions]>([
      ['station, float', {}],
      ['stop with arrivals', { header: { ...STOP, titleAction: undefined }, body: ARRIVALS }],
      [
        'flat with a leading action',
        { elevation: 'flat', header: { leadingAction: BACK, cornerActions: undefined } },
      ],
      ['article', { as: 'article' }],
      ['div', { as: 'div' }],
      [
        'error',
        {
          body: (
            <Banner
              tone="danger"
              message="No se pudo cargar la estación."
              action={{ label: 'Reintentar', onClick: ignorePress }}
            />
          ),
        },
      ],
    ])('passes axe: %s', async (_name, options) => {
      const { container } = renderCard(options);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });

    it('passes axe while busy', async () => {
      const titleId = 'card-title';
      const { container } = render(
        <Card titleId={titleId}>
          <Card.Header titleId={titleId} {...STATION} cornerActions={CLOSE} />
          <Card.Body busy busyLabel="Cargando la disponibilidad">
            {TILES}
          </Card.Body>
        </Card>,
      );

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
});
