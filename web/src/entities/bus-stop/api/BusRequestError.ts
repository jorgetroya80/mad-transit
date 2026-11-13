type RequestResult = { error: unknown; request?: Request; response?: Response };

// The API sends Retry-After in whole seconds.
function retryAfterMs(value: string | null | undefined): number | undefined {
  const seconds = Number(value);
  return value && Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

// Without a response the request never reached the API (network error or abort), so it has no
// status: the retry pace reads the status to tell a 4xx, which never retries, from the rest.
export class BusRequestError extends Error {
  readonly status: number | undefined;
  readonly retryAfterMs: number | undefined;

  constructor({ error, request, response }: RequestResult) {
    const status = response ? ` with ${response.status}` : '';
    super(`GET ${request?.url ?? 'request'} failed${status}`, { cause: error });
    this.name = 'BusRequestError';
    this.status = response?.status;
    this.retryAfterMs = retryAfterMs(response?.headers.get('Retry-After'));
  }
}

// Retry-After counts from the failure: until then, a retry by hand waits.
export function blockedUntil(error: unknown, failedAt: number): number {
  if (!(error instanceof BusRequestError) || error.retryAfterMs === undefined) return 0;
  return failedAt + error.retryAfterMs;
}
