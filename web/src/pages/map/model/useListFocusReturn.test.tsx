import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { useListFocusReturn } from './useListFocusReturn';

// A list with the DOM contract of widgets/station-list, and the detail heading and handle the
// mobile sheet passes. Without `isSheet` it is the desktop panel, where the list stays mounted.
function Page({ openStation, isSheet = false }: { openStation?: string; isSheet?: boolean }) {
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const listFallback = useRef<HTMLButtonElement>(null);
  const panelRef = useListFocusReturn(
    openStation,
    isSheet ? { detailHeading, listFallback } : undefined,
  );
  return (
    <>
      <div ref={panelRef}>
        <section data-station-list="nearby">
          <h3 tabIndex={-1}>Cercanas</h3>
          <button type="button" data-station-number="1a">
            Estación 1a
          </button>
        </section>
      </div>
      <h2 ref={detailHeading} tabIndex={-1}>
        Puerta del Sol A
      </h2>
      <button ref={listFallback} type="button">
        Mostrar lista · 2 estaciones con bicis
      </button>
    </>
  );
}

function row() {
  return screen.getByRole('button', { name: 'Estación 1a' });
}

describe('useListFocusReturn', () => {
  // `?station=1A` opens the station of row `1a`.
  it('focuses the detail opened from a row whose number differs only in case', async () => {
    const { rerender } = render(<Page isSheet />);
    await userEvent.click(row());

    rerender(<Page isSheet openStation="1A" />);

    expect(screen.getByRole('heading', { name: 'Puerta del Sol A' })).toHaveFocus();
  });

  it('returns the focus to a row whose number differs only in case from the closed detail', async () => {
    const { rerender } = render(<Page openStation="1A" />);
    await userEvent.click(row());
    screen.getByRole('heading', { name: 'Puerta del Sol A' }).focus();

    rerender(<Page />);

    expect(row()).toHaveFocus();
  });
});
