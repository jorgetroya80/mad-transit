import { freshnessOf } from './freshnessOf';

const NOW = new Date('2026-11-02T10:20:00Z');
const THIRTY_SECONDS_AGO = new Date('2026-11-02T10:19:30Z');
const SIX_MINUTES_AGO = new Date('2026-11-02T10:14:00Z');

describe('freshnessOf', () => {
  it.each([
    {
      status: 'ok',
      updatedAt: THIRTY_SECONDS_AGO,
      expected: { text: 'Actualizado hace 30 segundos', tone: 'success', action: 'Actualizar' },
    },
    {
      status: 'stale',
      updatedAt: SIX_MINUTES_AGO,
      expected: { text: 'Datos de hace 6 minutos', tone: 'warning', action: 'Reintentar' },
    },
    {
      status: 'error',
      updatedAt: undefined,
      expected: { text: 'Sin datos del servicio', tone: 'danger', action: 'Reintentar' },
    },
    {
      status: 'offline',
      updatedAt: SIX_MINUTES_AGO,
      expected: { text: 'Desconectado', tone: 'neutral', action: 'Reintentar' },
    },
  ] as const)('in $status says «$expected.text»', ({ status, updatedAt, expected }) => {
    expect(freshnessOf(status, updatedAt, NOW)).toEqual(expected);
  });

  it('says the stale data is unconfirmed when its age is unknown or just now', () => {
    expect(freshnessOf('stale', undefined, NOW).text).toBe('Datos sin confirmar');
    expect(freshnessOf('stale', NOW, NOW).text).toBe('Datos sin confirmar');
  });

  it('says fresh data is updated when its time is unknown', () => {
    expect(freshnessOf('ok', undefined, NOW).text).toBe('Actualizado');
  });

  it('says it is loading, without an action', () => {
    expect(freshnessOf('loading', undefined, NOW)).toEqual({ text: 'Cargando…', tone: 'neutral' });
  });
});
