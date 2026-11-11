// The library serves BiciMAD, the bus and any future screen, so no piece may know about either.
// `bike` and `bus` are icon names, not domain words.
const DOMAIN_WORDS = /estaci[oó]n|parada|bicimad|bici|autob[uú]s/i;

const LIBRARY_SOURCES = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

function domainWordIn(source: string) {
  return source.match(DOMAIN_WORDS)?.[0];
}

describe('shared/ui', () => {
  it('reads the library sources', () => {
    expect(Object.keys(LIBRARY_SOURCES)).toEqual(
      expect.arrayContaining(['./icons/Icon.tsx', './spinner/Spinner.tsx', './tone/tone.ts']),
    );
  });

  it.each(Object.entries(LIBRARY_SOURCES))('%s has no domain words', (_path, source) => {
    expect(domainWordIn(source)).toBeUndefined();
  });

  it.each(['estación', 'Estacion', 'parada', 'BiciMAD', 'bici', 'autobús', 'Autobus'])(
    'catches «%s»',
    (word) => {
      expect(domainWordIn(`label: '${word}'`)).toBe(word);
    },
  );

  it('allows the icon names bike and bus', () => {
    expect(domainWordIn("name: 'bike' | 'bus'")).toBeUndefined();
  });
});
