import { readFileSync } from 'node:fs';

// web-ui-migration retired these tokens: the screens read the library's tone-* and text-* scale.
const RETIRED_TOKENS =
  /\b(?:availability|notice)-(?:good|low|empty|off|unconfirmed|stale|error|offline)\b|\bsheet-subtitle\b/;

const CODE = import.meta.glob<string>(['../../**/*.{ts,tsx}', '!./retiredTokens.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Vitest hands CSS over empty, so the stylesheet is read from disk; Vitest runs from web/.
const SOURCES: Record<string, string> = {
  ...CODE,
  './index.css': readFileSync('src/app/styles/index.css', 'utf8'),
};

function retiredTokenIn(source: string) {
  return source.match(RETIRED_TOKENS)?.[0];
}

describe('retired tokens', () => {
  it('reads the web sources and styles', () => {
    expect(Object.keys(SOURCES)).toEqual(
      expect.arrayContaining(['./index.css', '../App.tsx', '../../shared/ui/icons/Icon.tsx']),
    );
  });

  it.each(Object.entries(SOURCES))('%s uses no retired token', (_path, source) => {
    expect(retiredTokenIn(source)).toBeUndefined();
  });

  it.each([
    'bg-availability-good',
    'text-availability-off-label',
    '--color-notice-stale-line',
    'bg-notice-offline',
    'text-sheet-subtitle',
  ])('catches «%s»', (token) => {
    expect(retiredTokenIn(`className="${token}"`)).toBeDefined();
  });

  it('allows the names that only share a word', () => {
    expect(retiredTokenIn('availabilityTone AvailabilityLegend text-sheet-title')).toBeUndefined();
  });
});
