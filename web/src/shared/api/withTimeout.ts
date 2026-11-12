import { REQUEST_TIMEOUT_MS } from '@/shared/config';

// TanStack's signal cancels a request nobody needs any more; the timeout fails one the API never
// answers, which then counts as a failed request.
export function withTimeout(signal: AbortSignal): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);
}
