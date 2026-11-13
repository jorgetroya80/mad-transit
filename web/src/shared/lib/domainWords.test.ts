// The library serves BiciMAD, the bus and any future screen, so no piece may know about either.
const DOMAIN_WORDS = /estaci[oó]n|parada|bicimad|bici|autob[uú]s/i;

const LIBRARY_SOURCES = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

function domainWordIn(source: string) {
  return source.match(DOMAIN_WORDS)?.[0];
}

describe('shared/lib', () => {
  it('reads the library sources', () => {
    expect(Object.keys(LIBRARY_SOURCES)).toEqual(
      expect.arrayContaining(['./time/formatClock.ts', './status/dataStatus.ts']),
    );
  });

  it.each(Object.entries(LIBRARY_SOURCES))('%s has no domain words', (_path, source) => {
    expect(domainWordIn(source)).toBeUndefined();
  });
});
