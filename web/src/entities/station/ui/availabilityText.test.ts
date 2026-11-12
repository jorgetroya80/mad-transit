import {
  availabilityCountText,
  availabilitySpokenText,
  availabilityText,
} from './availabilityText';

describe('availabilityText', () => {
  it.each([
    [1, 'bikes', '1 bici'],
    [3, 'bikes', '3 bicis'],
    [0, 'bikes', '0 bicis'],
    [1, 'docks', '1 anclaje libre'],
    [4, 'docks', '4 anclajes libres'],
    [0, 'docks', '0 anclajes libres'],
  ] as const)('says %i %s as "%s"', (count, need, expected) => {
    expect(availabilityText('good', count, need)).toBe(expected);
  });

  it('says "Fuera de servicio" when the station is off, whatever the count', () => {
    expect(availabilityText('off', 7, 'bikes')).toBe('Fuera de servicio');
    expect(availabilityText('off', 0, 'docks')).toBe('Fuera de servicio');
  });

  it.each([
    [3, 'bikes', '3 bicis, sin confirmar'],
    [1, 'docks', '1 anclaje libre, sin confirmar'],
    [0, 'bikes', '0 bicis, sin confirmar'],
  ] as const)('says unconfirmed %i %s as "%s"', (count, need, expected) => {
    expect(availabilityText('unconfirmed', count, need)).toBe(expected);
  });
});

describe('availabilityCountText', () => {
  it.each([
    [1, 'bikes', '1 bici'],
    [3, 'bikes', '3 bicis'],
    [1, 'docks', '1 anclaje libre'],
    [0, 'docks', '0 anclajes libres'],
  ] as const)('says %i %s as "%s"', (count, need, expected) => {
    expect(availabilityCountText(count, need)).toBe(expected);
  });
});

describe('availabilitySpokenText', () => {
  it.each([
    { level: 'good', count: 12, need: 'bikes', text: '12 bicis, Disponible' },
    { level: 'low', count: 1, need: 'bikes', text: '1 bici, Pocas' },
    { level: 'empty', count: 0, need: 'docks', text: '0 anclajes libres, Sin hueco' },
    { level: 'unconfirmed', count: 3, need: 'bikes', text: '3 bicis, Sin confirmar' },
    { level: 'off', count: 7, need: 'bikes', text: 'Fuera de servicio' },
  ] as const)('says $level $count $need as "$text"', ({ level, count, need, text }) => {
    expect(availabilitySpokenText(level, count, need)).toBe(text);
  });
});
