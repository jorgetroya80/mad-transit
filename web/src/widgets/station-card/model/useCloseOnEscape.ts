import { useCallback } from 'react';

// Escape closes the card from any control inside it. The keydown bubbles up to the card, which
// is a region rather than a control, hence a listener instead of an `onKeyDown` prop.
export function useCloseOnEscape(onClose: () => void) {
  return useCallback(
    (card: HTMLElement | null) => {
      if (!card) return undefined;
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      card.addEventListener('keydown', closeOnEscape);
      return () => card.removeEventListener('keydown', closeOnEscape);
    },
    [onClose],
  );
}
