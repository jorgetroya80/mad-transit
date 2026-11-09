import { formatClock } from '@/shared/lib';

// The heading and caption of the nearby list when it is the saved one (offline with data), in
// the panel on desktop and in the sheet header on mobile.
export const SAVED_LIST_TITLE = 'Últimos datos guardados';

export function savedListCaption(updatedAt: Date | undefined): string {
  if (!updatedAt) return 'Pueden no estar al día';
  return `De las ${formatClock(updatedAt)} · pueden no estar al día`;
}
