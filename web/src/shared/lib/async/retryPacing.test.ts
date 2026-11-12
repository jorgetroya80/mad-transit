import { type PacedQuery, restartWait, retryDelayMs } from './retryPacing';

function query(status: 'success' | 'error', errorUpdateCount: number): PacedQuery {
  return { state: { status, errorUpdateCount } };
}

describe('retryDelayMs', () => {
  it('waits 30 s while the requests succeed', () => {
    expect(retryDelayMs(query('success', 0))).toBe(30_000);
  });

  it('waits 30, 60 and 120 s after 1, 2 and 3 failures', () => {
    expect(retryDelayMs(query('error', 1))).toBe(30_000);
    expect(retryDelayMs(query('error', 2))).toBe(60_000);
    expect(retryDelayMs(query('error', 3))).toBe(120_000);
  });

  it('keeps waiting 120 s after more failures', () => {
    expect(retryDelayMs(query('error', 4))).toBe(120_000);
    expect(retryDelayMs(query('error', 9))).toBe(120_000);
  });

  it('restarts the count after a success', () => {
    const paced = query('error', 3);
    expect(retryDelayMs(paced)).toBe(120_000);

    paced.state = { status: 'success', errorUpdateCount: 3 };
    expect(retryDelayMs(paced)).toBe(30_000);

    paced.state = { status: 'error', errorUpdateCount: 4 };
    expect(retryDelayMs(paced)).toBe(30_000);

    paced.state = { status: 'error', errorUpdateCount: 5 };
    expect(retryDelayMs(paced)).toBe(60_000);
  });

  it('restarts the count on a manual retry', () => {
    const paced = query('error', 3);
    restartWait(paced);
    expect(retryDelayMs(paced)).toBe(30_000);

    paced.state = { status: 'error', errorUpdateCount: 4 };
    expect(retryDelayMs(paced)).toBe(30_000);
  });
});
