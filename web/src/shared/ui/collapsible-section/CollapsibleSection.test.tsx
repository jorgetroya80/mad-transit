import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../../../test/axe';
import { StarIcon } from '../icons';
import { CollapsibleSection } from './CollapsibleSection';

const STORAGE_KEY = 'test:section-open';

function renderSection() {
  return render(
    <CollapsibleSection title="Favoritas" count={2} icon={StarIcon} storageKey={STORAGE_KEY}>
      <p>Contenido</p>
    </CollapsibleSection>,
  );
}

function header() {
  return screen.getByRole('button', { name: 'Favoritas · 2' });
}

describe('CollapsibleSection', () => {
  afterEach(() => localStorage.clear());

  it('is open by default, with a header button that controls the content', () => {
    renderSection();

    expect(screen.getByRole('heading', { level: 2, name: 'Favoritas · 2' })).toBeInTheDocument();
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    const content = screen.getByText('Contenido');
    expect(content).toBeVisible();
    expect(header()).toHaveAttribute('aria-controls', content.parentElement?.id);
    expect(screen.getByRole('region', { name: 'Favoritas · 2' })).toBeInTheDocument();
  });

  it('folds and unfolds the content from its header', async () => {
    renderSection();

    await userEvent.click(header());

    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Contenido')).not.toBeVisible();

    await userEvent.click(header());

    expect(header()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Contenido')).toBeVisible();
  });

  it('remembers that it was folded after a reload', async () => {
    const { unmount } = renderSection();
    await userEvent.click(header());
    unmount();

    renderSection();

    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Contenido')).not.toBeVisible();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('stays open when the stored state is not valid', () => {
    localStorage.setItem(STORAGE_KEY, '"folded"');

    renderSection();

    expect(header()).toHaveAttribute('aria-expanded', 'true');
  });

  it('lets the heading take the focus without a tab stop', () => {
    renderSection();

    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('tabindex', '-1');
  });

  it('puts the header under an h3 when asked', () => {
    render(
      <CollapsibleSection
        title="Favoritas"
        count={2}
        icon={StarIcon}
        storageKey={STORAGE_KEY}
        level={3}
      >
        <p>Contenido</p>
      </CollapsibleSection>,
    );

    expect(screen.getByRole('heading', { level: 3 })).toContainElement(header());
  });

  it.each([
    { state: 'open', clicks: 0 },
    { state: 'folded', clicks: 1 },
  ])('has no axe violations when $state', async ({ clicks }) => {
    const { container } = renderSection();
    for (let click = 0; click < clicks; click += 1) await userEvent.click(header());

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
