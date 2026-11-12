import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { formatClock } from '@/shared/lib';
import { expectNoAxeViolations } from '../../../../test/axe';
import { staleRetryButton } from '../../../../test/staleNotice';
import { ICON_DRAWINGS } from '../icons';
import { StaleNotice } from './StaleNotice';
import { UpdatedAt } from './UpdatedAt';

const NOW = new Date('2026-10-13T10:20:00Z');
const FIVE_MINUTES_AGO = new Date('2026-10-13T10:15:00Z');

describe('data freshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it('says how long ago the data was updated', () => {
    render(<UpdatedAt date={FIVE_MINUTES_AGO} />);

    expect(screen.getByText(/Actualizado/)).toHaveTextContent('Actualizado hace 5 minutos');
  });

  describe('stale notice', () => {
    const TWELVE_MINUTES_AGO = new Date('2026-10-13T10:08:00Z');
    const DESKTOP_TAIL = 'puede que ya no sean exactos.';
    const MOBILE_TAIL = 'No hemos podido actualizar; puede que ya no sean exactos.';

    function noop() {}

    it('says on desktop that it could not update, with the 24 h time of the data', () => {
      render(<StaleNotice layout="desktop" updatedAt={TWELVE_MINUTES_AGO} onRetry={noop} />);

      const notice = screen.getByRole('status');
      expect(notice).toHaveTextContent(
        `No hemos podido actualizar. Mostramos los datos de las ${formatClock(TWELVE_MINUTES_AGO)}; ${DESKTOP_TAIL}`,
      );
      expect(within(notice).getByText('No hemos podido actualizar.').tagName).toBe('STRONG');
    });

    it('leaves the time out on desktop when it is unknown', () => {
      render(<StaleNotice layout="desktop" updatedAt={undefined} onRetry={noop} />);

      expect(screen.getByRole('status')).toHaveTextContent(
        'No hemos podido actualizar. Puede que los datos ya no sean exactos.',
      );
    });

    it.each([
      { age: '12 min', updatedAt: TWELVE_MINUTES_AGO, lead: 'Datos de hace 12 min.' },
      { age: 'under a minute', updatedAt: NOW, lead: 'Datos de hace menos de 1 min.' },
      { age: 'unknown', updatedAt: undefined, lead: 'Datos sin confirmar.' },
    ])('leads on mobile with the age in minutes ($age)', ({ updatedAt, lead }) => {
      render(<StaleNotice layout="mobile" updatedAt={updatedAt} onRetry={noop} />);

      const notice = screen.getByRole('status');
      expect(notice).toHaveTextContent(`${lead} ${MOBILE_TAIL}`);
      expect(within(notice).getByText(lead).tagName).toBe('STRONG');
    });

    it('ages the mobile lead as time goes by', () => {
      render(<StaleNotice layout="mobile" updatedAt={TWELVE_MINUTES_AGO} onRetry={noop} />);

      act(() => vi.advanceTimersByTime(60_000));

      expect(screen.getByRole('status')).toHaveTextContent(`Datos de hace 13 min. ${MOBILE_TAIL}`);
    });

    it('is a warning banner with the clock and an outlined «Reintentar» beside its text', () => {
      render(<StaleNotice layout="desktop" updatedAt={TWELVE_MINUTES_AGO} onRetry={noop} />);
      const notice = screen.getByRole('status');
      const banner = notice.parentElement;

      expect(banner).toHaveClass('bg-tone-warning-soft', 'border-tone-warning-soft-line');
      expect(banner?.querySelector('svg path')).toHaveAttribute('d', ICON_DRAWINGS.clock.paths[0]);
      expect(notice).not.toContainElement(staleRetryButton(notice));
      expect(staleRetryButton(notice)).toHaveClass('h-10', 'border-tone-warning-icon');
      expect(staleRetryButton(notice)).not.toHaveAttribute('aria-disabled');
    });

    it('keeps «Reintentar» busy until the retry settles', async () => {
      let resolve = noop;
      const onRetry = vi.fn<() => Promise<void>>(
        () =>
          new Promise<void>((res) => {
            resolve = res;
          }),
      );
      render(<StaleNotice layout="desktop" updatedAt={TWELVE_MINUTES_AGO} onRetry={onRetry} />);
      const button = staleRetryButton(screen.getByRole('status'));

      button.focus();
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveFocus();
      fireEvent.click(button);
      expect(onRetry).toHaveBeenCalledOnce();

      await act(async () => resolve());
      expect(button).not.toHaveAttribute('aria-busy');
    });

    it.each(['desktop', 'mobile'] as const)('has no axe violations on %s', async (layout) => {
      vi.useRealTimers();
      const { container } = render(
        <StaleNotice layout={layout} updatedAt={TWELVE_MINUTES_AGO} onRetry={noop} />,
      );

      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    });
  });
});
