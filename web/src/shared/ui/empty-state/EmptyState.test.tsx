import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { EmptyState } from '.';

type EmptyStateProps = ComponentProps<typeof EmptyState>;
type EmptyStateAction = NonNullable<EmptyStateProps['action']>;

const API_DOWN = {
  tone: 'danger',
  icon: 'cloud-alert',
  title: 'No podemos cargar las estaciones',
  message:
    'El servicio no está respondiendo. Suele ser temporal; no es un problema de tu conexión.',
} as const;

const STOP_NOT_FOUND = {
  tone: 'neutral',
  icon: 'search',
  title: 'No existe la parada 9999',
  message: 'Revisa el número en la marquesina.',
} as const;

const NOTE = 'Lo seguiremos intentando automáticamente.';

function retryAction(overrides: Partial<EmptyStateAction> = {}): EmptyStateAction {
  return { label: 'Reintentar', icon: 'refresh', onClick: () => {}, ...overrides };
}

function renderEmptyState(props: Partial<EmptyStateProps> = {}) {
  const { container } = render(<EmptyState {...API_DOWN} {...props} />);
  return { root: container.firstElementChild as HTMLElement, container };
}

function heading(name: string = API_DOWN.title) {
  return screen.getByRole('heading', { name });
}

function retryButton() {
  return screen.getByRole('button', { name: 'Reintentar' });
}

function circleOf(root: HTMLElement) {
  return root.querySelector('svg')?.parentElement as HTMLElement;
}

describe('EmptyState', () => {
  it('requires a title and a message, and a label when it has an action', () => {
    expectTypeOf<Pick<EmptyStateProps, 'title' | 'message'>>().toEqualTypeOf<{
      title: string;
      message: string;
    }>();
    expectTypeOf<Pick<EmptyStateAction, 'label'>>().toEqualTypeOf<{ label: string }>();
  });

  it.each([
    ['stations', API_DOWN],
    ['stops', STOP_NOT_FOUND],
  ] as const)('names its heading and explains about %s', (_domain, props) => {
    renderEmptyState(props);

    expect(heading(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.message)).toHaveClass('text-fg-muted');
  });

  it('is an h2 by default and an h3 when asked', () => {
    const { unmount } = render(<EmptyState {...API_DOWN} />);
    expect(heading()).toHaveProperty('tagName', 'H2');
    unmount();

    render(<EmptyState {...API_DOWN} headingLevel={3} />);
    expect(heading()).toHaveProperty('tagName', 'H3');
  });

  it('takes programmatic focus on its heading, without a tab stop or a ring', () => {
    renderEmptyState();
    const title = heading();

    title.focus();

    expect(title).toHaveFocus();
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(title).toHaveClass('focus-visible:outline-none');
  });

  it.each([
    ['danger', 'bg-tone-danger-soft', 'text-tone-danger-icon'],
    ['neutral', 'bg-chip', 'text-fg-muted'],
    ['warning', 'bg-tone-warning-soft', 'text-tone-warning-icon'],
  ] as const)('draws the %s circle and icon', (tone, circleClass, iconClass) => {
    const { root } = renderEmptyState({ tone });
    const circle = circleOf(root);

    expect(circle).toHaveClass('rounded-full', circleClass);
    expect(circle).toHaveAttribute('aria-hidden', 'true');
    expect(circle.querySelector('svg')).toHaveClass(iconClass);
    expect(circle.querySelector('path')).toHaveAttribute(
      'd',
      ICON_DRAWINGS['cloud-alert'].paths[0],
    );
  });

  it('keeps the title in fg and the message in fg-muted', () => {
    renderEmptyState();

    expect(heading()).toHaveClass('text-fg');
    expect(screen.getByText(API_DOWN.message)).toHaveClass('text-fg-muted', 'max-w-80');
  });

  it.each([
    {
      size: 'md',
      padding: ['px-8', 'py-10'],
      circleSize: 'size-18',
      iconSize: '34',
      title: ['text-title-lg'],
    },
    {
      size: 'sm',
      padding: ['px-7', 'py-4'],
      circleSize: 'size-16',
      iconSize: '30',
      title: ['text-[1.1875rem]/[1.625rem]', 'font-bold'],
    },
  ] as const)('measures $size', ({ size, padding, circleSize, iconSize, title }) => {
    const { root } = renderEmptyState({ size });
    const circle = circleOf(root);

    expect(root).toHaveClass(...padding);
    expect(circle).toHaveClass(circleSize);
    expect(circle.querySelector('svg')).toHaveAttribute('width', iconSize);
    expect(heading()).toHaveClass(...title);
  });

  describe('action', () => {
    it('is a large button with its icon', async () => {
      const onClick = vi.fn<() => void>();
      renderEmptyState({ action: retryAction({ onClick }) });

      await userEvent.click(retryButton());

      expect(retryButton()).toHaveClass('h-12');
      expect(retryButton().querySelector('path')).toHaveAttribute(
        'd',
        ICON_DRAWINGS.refresh.paths[0],
      );
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does not take the focus when it appears', () => {
      renderEmptyState({ action: retryAction() });

      expect(retryButton()).not.toHaveFocus();
      expect(document.body).toHaveFocus();
    });

    it('stays focusable while busy', () => {
      renderEmptyState({ action: retryAction({ busy: true }) });
      const button = retryButton();

      button.focus();

      expect(button).toHaveFocus();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('can be disabled', () => {
      renderEmptyState({ action: retryAction({ disabled: true }) });

      expect(retryButton()).toBeDisabled();
    });
  });

  it('shows the note in text-meta under the action', () => {
    renderEmptyState({ action: retryAction(), note: NOTE });
    const note = screen.getByText(NOTE);

    expect(note).toHaveClass('text-meta', 'text-fg-muted');
    expect(retryButton().compareDocumentPosition(note)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('shows extra content', () => {
    renderEmptyState({
      ...STOP_NOT_FOUND,
      children: <button type="button">Ver paradas cercanas</button>,
    });

    expect(screen.getByRole('button', { name: 'Ver paradas cercanas' })).toBeInTheDocument();
  });

  describe('announce', () => {
    function renderEverything(announce: EmptyStateProps['announce']) {
      renderEmptyState({
        announce,
        action: retryAction(),
        note: NOTE,
        children: <button type="button">Ver paradas cercanas</button>,
      });
    }

    function expectOutside(region: HTMLElement) {
      expect(region).not.toContainElement(retryButton());
      expect(region).not.toContainElement(screen.getByText(NOTE));
      expect(region).not.toContainElement(
        screen.getByRole('button', { name: 'Ver paradas cercanas' }),
      );
    }

    it('is an alert holding the heading and the message by default', () => {
      renderEverything(undefined);
      const region = screen.getByRole('alert');

      expect(region.tagName).toBe('DIV');
      expect(region).toContainElement(heading());
      expect(region).toContainElement(screen.getByText(API_DOWN.message));
      expectOutside(region);
    });

    it('is an <output> holding the heading and the message as status', () => {
      renderEverything('status');
      const region = screen.getByRole('status');

      expect(region.tagName).toBe('OUTPUT');
      expect(region).toContainElement(heading());
      expect(region).toHaveTextContent(`${API_DOWN.title} ${API_DOWN.message}`);
      expectOutside(region);
    });

    it('is no live region as none', () => {
      renderEverything('none');

      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
      expect(document.querySelector('output, [aria-live]')).toBeNull();
    });
  });

  it.each(['alert', 'status', 'none'] as const)(
    'gives its heading and message an id as %s, to describe a field with',
    (announce) => {
      render(
        <>
          <input aria-label="Buscar parada" aria-describedby="not-found" />
          <EmptyState {...STOP_NOT_FOUND} announce={announce} messageId="not-found" />
        </>,
      );

      expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
        `${STOP_NOT_FOUND.title} ${STOP_NOT_FOUND.message}`,
      );
    },
  );

  it.each([
    ['danger with action and note', { action: retryAction(), note: NOTE }],
    ['neutral', STOP_NOT_FOUND],
    ['warning small', { tone: 'warning', icon: 'clock', size: 'sm' }],
    ['status', { announce: 'status' }],
    ['none as h3', { announce: 'none', headingLevel: 3 }],
    ['busy action', { action: retryAction({ busy: true }) }],
    ['disabled action', { action: retryAction({ disabled: true }) }],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = renderEmptyState(props);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
