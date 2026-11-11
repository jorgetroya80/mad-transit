import { useCallback } from 'react';

function isFrom(element: HTMLElement, event: KeyboardEvent) {
  return event.target instanceof Node && element.contains(event.target);
}

// Escape closes the element from any control inside it. It is a region rather than a control,
// hence a listener instead of an `onKeyDown` prop. The listener sits on the document so it runs
// after React's own handlers: an inner control that already used the Escape (a search box that
// clears its text calls preventDefault) keeps it.
export function useCloseOnEscape(onClose: () => void) {
  return useCallback(
    (element: HTMLElement | null) => {
      if (!element) return undefined;
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && !event.defaultPrevented && isFrom(element, event)) onClose();
      };
      const { ownerDocument } = element;
      ownerDocument.addEventListener('keydown', closeOnEscape);
      return () => ownerDocument.removeEventListener('keydown', closeOnEscape);
    },
    [onClose],
  );
}
