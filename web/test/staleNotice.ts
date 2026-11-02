import { screen, type waitForOptions } from '@testing-library/react';

// Badges also show «Sin confirmar», hidden from assistive technology; the stale notice is not.
export function findStaleNotice(options?: waitForOptions) {
  return screen.findByText(/^Sin confirmar/, { ignore: '[aria-hidden="true"]' }, options);
}
