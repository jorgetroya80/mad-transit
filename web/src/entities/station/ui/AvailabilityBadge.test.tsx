import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { AvailabilityBadge } from './AvailabilityBadge';

const PILL_SIZE = ['h-7.5', 'w-10', 'md:h-8', 'md:w-11'];

describe('AvailabilityBadge', () => {
  it.each([
    { level: 'good', count: 12, need: 'bikes', number: '12', label: 'Disponible' },
    { level: 'good', count: 9, need: 'docks', number: '9', label: 'Disponible' },
    { level: 'low', count: 2, need: 'bikes', number: '2', label: 'Pocas' },
    { level: 'low', count: 1, need: 'docks', number: '1', label: 'Pocos' },
    { level: 'empty', count: 0, need: 'bikes', number: '0', label: 'Sin bicis' },
    { level: 'empty', count: 0, need: 'docks', number: '0', label: 'Sin hueco' },
    { level: 'off', count: 7, need: 'bikes', number: '–', label: 'Fuera de servicio' },
    { level: 'off', count: 7, need: 'docks', number: '–', label: 'Fuera de servicio' },
    { level: 'unconfirmed', count: 3, need: 'bikes', number: '3', label: 'Sin confirmar' },
    { level: 'unconfirmed', count: 3, need: 'docks', number: '3', label: 'Sin confirmar' },
  ] as const)(
    'shows $level $need as "$number" in the pill and "$label" below it',
    ({ level, count, need, number, label }) => {
      render(<AvailabilityBadge level={level} count={count} need={need} />);

      const pill = screen.getByText(number);
      expect(pill).toHaveClass(`bg-availability-${level}`, ...PILL_SIZE);
      expect(screen.getByText(label, { ignore: '.sr-only' })).toHaveClass(
        `text-availability-${level}-label`,
      );
    },
  );

  it.each([
    { level: 'low', count: 1, need: 'bikes', text: '1 bici, Pocas' },
    { level: 'empty', count: 0, need: 'docks', text: '0 anclajes libres, Sin hueco' },
    { level: 'unconfirmed', count: 3, need: 'bikes', text: '3 bicis, Sin confirmar' },
    { level: 'off', count: 7, need: 'bikes', text: 'Fuera de servicio' },
  ] as const)('tells screen readers "$text"', ({ level, count, need, text }) => {
    render(<AvailabilityBadge level={level} count={count} need={need} />);

    expect(screen.getByText(text, { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('aligns the pill and its label to the right edge', () => {
    render(<AvailabilityBadge level="good" count={12} need="bikes" />);

    const label = screen.getByText('Disponible');
    expect(label.parentElement).toHaveClass('items-end');
    expect(label).toHaveClass('text-right');
  });

  it('centers the pill and its label when asked to', () => {
    render(<AvailabilityBadge level="good" count={12} need="bikes" align="center" />);

    const label = screen.getByText('Disponible');
    expect(label.parentElement).toHaveClass('items-center');
    expect(label).toHaveClass('text-center');
    expect(label).not.toHaveClass('text-right');
  });

  it('draws the empty pill with a dashed border', () => {
    render(<AvailabilityBadge level="empty" count={0} need="bikes" />);

    expect(screen.getByText('0')).toHaveClass(
      'border-2',
      'border-dashed',
      'border-availability-empty-line',
    );
  });

  it('hides the whole badge from assistive technology when decorative', () => {
    const { container } = render(
      <AvailabilityBadge level="low" count={2} need="bikes" decorative />,
    );

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.sr-only')).toBeNull();
  });

  it.each([false, true])('has no axe violations (decorative: %s)', async (decorative) => {
    const { container } = render(
      <AvailabilityBadge level="good" count={12} need="bikes" decorative={decorative} />,
    );

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
