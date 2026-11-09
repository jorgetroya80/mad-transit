import { screen, waitFor, type waitForOptions } from '@testing-library/react';

// Both layouts of the stale notice say it; it is the only status that does.
const STALE_TEXT = /No hemos podido actualizar/;

export function findStaleNotice(options?: waitForOptions) {
  return waitFor(() => {
    const notice = screen
      .getAllByRole('status')
      .find((status) => STALE_TEXT.test(status.textContent ?? ''));
    if (!notice) throw new Error('No stale notice');
    return notice;
  }, options);
}
