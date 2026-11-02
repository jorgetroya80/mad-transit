import { availabilityStatusText } from './availabilityStatusText';

describe('availabilityStatusText', () => {
  it.each([
    ['good', 'bikes', 'Disponible'],
    ['good', 'docks', 'Disponible'],
    ['low', 'bikes', 'Pocas'],
    ['low', 'docks', 'Pocos'],
    ['empty', 'bikes', 'Sin bicis'],
    ['empty', 'docks', 'Sin hueco'],
    ['off', 'bikes', 'Fuera de servicio'],
    ['off', 'docks', 'Fuera de servicio'],
    ['unconfirmed', 'bikes', 'Sin confirmar'],
    ['unconfirmed', 'docks', 'Sin confirmar'],
  ] as const)('labels %s %s as "%s"', (level, need, expected) => {
    expect(availabilityStatusText(level, need)).toBe(expected);
  });
});
