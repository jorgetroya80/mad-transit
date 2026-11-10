import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, useState } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { SearchField } from '.';

type SearchFieldProps = ComponentProps<typeof SearchField>;
type FieldOptions = Partial<SearchFieldProps>;

const STATIONS = {
  label: 'Buscar estación',
  placeholder: 'Número o nombre (p. ej. 33 o Sol)',
  hint: 'Busca por número de estación, calle o plaza.',
  clearLabel: 'Borrar búsqueda',
} as const;

const STOPS = {
  label: 'Buscar parada por número',
  placeholder: 'Número de parada (p. ej. 72)',
  error: 'El número de parada tiene de 1 a 4 cifras.',
  clearLabel: 'Borrar el número de parada',
  inputMode: 'numeric',
} as const;

function renderField(props: FieldOptions = {}) {
  const onChange = vi.fn<(value: string) => void>();
  const { container } = render(
    <SearchField {...STATIONS} value="" onChange={onChange} {...props} />,
  );
  return { onChange, container };
}

// A field that keeps its own text, as a screen would.
function StatefulField(props: FieldOptions) {
  const [value, setValue] = useState(props.value ?? '');
  return <SearchField {...STATIONS} {...props} value={value} onChange={setValue} />;
}

function input(name: string = STATIONS.label) {
  return screen.getByRole('searchbox', { name });
}

function clearButton() {
  return screen.queryByRole('button', { name: STATIONS.clearLabel });
}

function iconPathsOf(element: Element) {
  return [...element.querySelectorAll('svg path')].map((path) => path.getAttribute('d'));
}

describe('SearchField', () => {
  it('requires a label and a clear label', () => {
    expectTypeOf<Pick<SearchFieldProps, 'label' | 'clearLabel'>>().toEqualTypeOf<{
      label: string;
      clearLabel: string;
    }>();
  });

  it('is a search input named by its label', () => {
    renderField();
    const box = input();

    expect(box).toHaveAttribute('type', 'search');
    expect(screen.getByText(STATIONS.label).tagName).toBe('LABEL');
    expect(screen.getByText(STATIONS.label)).toHaveAttribute('for', box.id);
  });

  it.each([
    ['stations', STATIONS],
    ['stops', STOPS],
  ] as const)('takes its texts for %s', (_domain, texts) => {
    render(<SearchField {...texts} value="72" onChange={vi.fn<(value: string) => void>()} />);

    expect(input(texts.label)).toHaveAttribute('placeholder', texts.placeholder);
    expect(screen.getByRole('button', { name: texts.clearLabel })).toBeInTheDocument();
  });

  it('shows the label above the box by default', () => {
    renderField();

    expect(screen.getByText(STATIONS.label)).not.toHaveClass('sr-only');
    expect(screen.getByText(STATIONS.label)).toHaveClass('text-body', 'font-semibold');
  });

  it('hides the label visually but keeps it as the name, never using the placeholder', () => {
    renderField({ labelVisible: false });

    expect(screen.getByText(STATIONS.label)).toHaveClass('sr-only');
    expect(input()).toHaveAccessibleName(STATIONS.label);
  });

  it('calls onChange on every change', async () => {
    const { onChange } = renderField();

    await userEvent.type(input(), '3');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('3');
  });

  it.each([
    [undefined, 'search'],
    ['numeric', 'numeric'],
  ] as const)('opens the %s keyboard', (inputMode, expected) => {
    renderField({ inputMode });

    expect(input()).toHaveAttribute('inputmode', expected);
  });

  it('shows the magnifier in fg-muted', () => {
    const { container } = renderField();
    const magnifier = container.querySelector('svg');

    expect(magnifier).toHaveClass('text-fg-muted');
    expect(iconPathsOf(container)).toEqual(ICON_DRAWINGS.search.paths);
  });

  describe('shape', () => {
    it('is a 48 px box by default', () => {
      renderField();

      expect(input()).toHaveClass('h-12', 'rounded-control', 'text-input');
      expect(input()).not.toHaveClass('shadow-pill');
    });

    it('is a 44 px floating pill', () => {
      renderField({ shape: 'pill' });

      expect(input()).toHaveClass('h-11', 'rounded-full', 'shadow-pill');
    });
  });

  describe('normal', () => {
    it('draws a surface box with a 1 px input-line border and fg text', () => {
      renderField();

      expect(input()).toHaveClass(
        'bg-surface',
        'border',
        'border-input-line',
        'text-fg',
        'placeholder:text-fg-muted',
        'hover:border-fg-muted',
      );
    });

    it('turns the border 2 px primary with the library ring on focus', () => {
      renderField();

      expect(input()).toHaveClass(
        'focus-ring',
        'focus:border-primary',
        'focus:inset-ring-1',
        'focus:inset-ring-primary',
      );
    });

    it('leaves room for the magnifier and for the clear button', () => {
      renderField();
      expect(input()).toHaveClass('pl-11', 'pr-3.5');
    });
  });

  describe('clear button', () => {
    it('appears only with text', () => {
      renderField();
      expect(clearButton()).toBeNull();
    });

    it('is a 44 px button with the close icon and room for it in the box', () => {
      renderField({ value: 'Sol' });
      const button = clearButton();

      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('size-11');
      expect(iconPathsOf(button as HTMLElement)).toEqual(ICON_DRAWINGS.close.paths);
      expect(input()).toHaveClass('pr-13');
    });

    it('is hidden while disabled', () => {
      renderField({ value: 'Sol', disabled: true });
      expect(clearButton()).toBeNull();
    });

    it('empties the value by default and returns the focus to the box', async () => {
      render(<StatefulField value="Sol" />);

      await userEvent.click(clearButton() as HTMLElement);

      expect(input()).toHaveValue('');
      expect(input()).toHaveFocus();
      expect(clearButton()).toBeNull();
    });

    it('calls onClear instead when given, and still returns the focus', async () => {
      const onClear = vi.fn<() => void>();
      const { onChange } = renderField({ value: 'Sol', onClear });

      await userEvent.click(clearButton() as HTMLElement);

      expect(onClear).toHaveBeenCalledOnce();
      expect(onChange).not.toHaveBeenCalled();
      expect(input()).toHaveFocus();
    });
  });

  describe('Escape', () => {
    it('clears the text and keeps the focus in the box', async () => {
      render(<StatefulField value="Sol" />);

      await userEvent.click(input());
      await userEvent.keyboard('{Escape}');

      expect(input()).toHaveValue('');
      expect(input()).toHaveFocus();
    });

    it('calls onClear when given', async () => {
      const onClear = vi.fn<() => void>();
      renderField({ value: 'Sol', onClear });

      await userEvent.click(input());
      await userEvent.keyboard('{Escape}');

      expect(onClear).toHaveBeenCalledOnce();
    });

    it('does nothing without text', async () => {
      const onClear = vi.fn<() => void>();
      const { onChange } = renderField({ onClear });

      await userEvent.click(input());
      await userEvent.keyboard('{Escape}');

      expect(onClear).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('hint', () => {
    it('describes the box in text-meta fg-muted', () => {
      renderField();

      expect(input()).toHaveAccessibleDescription(STATIONS.hint);
      expect(screen.getByText(STATIONS.hint)).toHaveClass('text-meta', 'text-fg-muted');
      expect(input()).not.toHaveAttribute('aria-invalid');
    });

    it('is optional: no description without it', () => {
      renderField({ hint: undefined });

      expect(input()).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('error', () => {
    function renderError(props: FieldOptions = {}) {
      return renderField({ value: '12345', error: STOPS.error, ...props });
    }

    it('replaces the hint and marks the box invalid', () => {
      renderError();

      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(input()).toHaveAccessibleDescription(STOPS.error);
      expect(screen.queryByText(STATIONS.hint)).toBeNull();
    });

    it('shows the info icon and the danger label color', () => {
      renderError();
      const message = screen.getByText(STOPS.error);

      expect(message).toHaveClass('text-meta', 'text-tone-danger-label');
      expect(iconPathsOf(message)).toEqual(ICON_DRAWINGS.info.paths);
    });

    it('draws the box border 2 px danger and the magnifier in danger', () => {
      const { container } = renderError();

      expect(input()).toHaveClass(
        'border-tone-danger-line',
        'inset-ring-1',
        'inset-ring-tone-danger-line',
      );
      expect(input().className).not.toMatch(/hover:|focus:border-primary/);
      expect(container.querySelector('svg')).toHaveClass('text-tone-danger-icon');
    });

    it('is not a live region', () => {
      const { container } = renderError();

      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
      expect(container.querySelector('[aria-live]')).toBeNull();
    });
  });

  describe('disabled', () => {
    it('greys out the box and keeps the hint', () => {
      renderField({ disabled: true, placeholder: 'Disponible al volver a conectarte' });

      expect(input()).toBeDisabled();
      expect(input()).toHaveClass('bg-surface-disabled', 'border-line-strong');
      expect(input().className).not.toMatch(/hover:/);
      expect(screen.getByText(STATIONS.hint)).toHaveClass('text-fg-muted');
    });
  });

  describe('busy', () => {
    it('swaps the magnifier for a primary spinner and keeps the box as normal', () => {
      const { container } = renderField({ value: 'Sol', busy: true });
      const svgs = container.querySelectorAll('svg');

      expect(svgs[0]).toHaveClass('animate-spin', 'text-primary');
      expect(svgs[0]).toHaveAttribute('width', '20');
      expect(iconPathsOf(container)).not.toContain(ICON_DRAWINGS.search.paths[0]);
      expect(input()).toHaveClass('border-input-line');
      expect(input()).toBeEnabled();
    });
  });

  it.each([
    ['normal', {}],
    ['with text', { value: 'Sol' }],
    ['with a hidden label', { labelVisible: false, shape: 'pill' }],
    ['without hint', { hint: undefined }],
    ['error', { ...STOPS, value: '12345' }],
    ['disabled', { disabled: true, value: 'Sol' }],
    ['busy', { busy: true, value: 'Sol' }],
    ['pill with text', { shape: 'pill', labelVisible: false, value: 'Sol' }],
  ] as const satisfies readonly (readonly [string, FieldOptions])[])(
    'passes axe %s',
    async (_name, props) => {
      const { container } = renderField(props);

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    },
  );
});
