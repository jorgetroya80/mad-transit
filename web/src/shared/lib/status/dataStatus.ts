import { STALE_AFTER_MS } from '@/shared/config';

export type DataStatus = 'loading' | 'ok' | 'stale' | 'error' | 'offline';

type StatusInput = {
  hasData: boolean;
  failed: boolean;
  apiStale: boolean;
  updatedAt: Date | undefined;
  now: number;
  online: boolean;
};

// Priority: offline, then stale or ok when there is data, then error, then loading.
export function dataStatus({
  hasData,
  failed,
  apiStale,
  updatedAt,
  now,
  online,
}: StatusInput): DataStatus {
  if (!online) return 'offline';
  if (hasData) {
    const tooOld = updatedAt !== undefined && now - updatedAt.getTime() > STALE_AFTER_MS;
    return failed || apiStale || tooOld ? 'stale' : 'ok';
  }
  return failed ? 'error' : 'loading';
}
