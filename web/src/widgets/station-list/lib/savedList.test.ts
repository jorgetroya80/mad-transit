import { formatClock } from '@/shared/lib';
import { savedListCaption } from './savedList';

describe('savedListCaption', () => {
  it('dates the saved list by its 24 h local time', () => {
    const updatedAt = new Date('2026-11-09T10:42:00Z');

    expect(savedListCaption(updatedAt)).toBe(
      `De las ${formatClock(updatedAt)} · pueden no estar al día`,
    );
  });

  it('only warns without a known time', () => {
    expect(savedListCaption(undefined)).toBe('Pueden no estar al día');
  });
});
