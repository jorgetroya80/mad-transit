import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { KeyboardEvent } from 'react';
import { useCloseOnEscape } from './useCloseOnEscape';

function keepEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') event.preventDefault();
}

function Panel({ onClose }: { onClose: () => void }) {
  const panelRef = useCloseOnEscape(onClose);
  return (
    <>
      <div ref={panelRef}>
        <button type="button">Dentro</button>
        <input aria-label="Usa Escape" onKeyDown={keepEscape} />
      </div>
      <button type="button">Fuera</button>
    </>
  );
}

function renderPanel() {
  const onClose = vi.fn<() => void>();
  const view = render(<Panel onClose={onClose} />);
  return { onClose, ...view };
}

describe('useCloseOnEscape', () => {
  it('closes with Escape from a control inside', async () => {
    const { onClose } = renderPanel();
    screen.getByRole('button', { name: 'Dentro' }).focus();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores other keys', async () => {
    const { onClose } = renderPanel();
    screen.getByRole('button', { name: 'Dentro' }).focus();

    await userEvent.keyboard('{Enter}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores Escape from outside', async () => {
    const { onClose } = renderPanel();
    screen.getByRole('button', { name: 'Fuera' }).focus();

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves an Escape that a control inside already used', async () => {
    const { onClose } = renderPanel();
    screen.getByRole('textbox', { name: 'Usa Escape' }).focus();

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', async () => {
    const { onClose, unmount } = renderPanel();
    unmount();

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });
});
