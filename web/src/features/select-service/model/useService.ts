import { getRouteApi } from '@tanstack/react-router';
import { useCallback } from 'react';

const mapRoute = getRouteApi('/');

export type Service = 'bicimad' | 'bus';

// Replace, not push: switching service is not a place to go back to. The other service's
// `station` or `stop` goes with it; the need stays.
export function useService(): [Service, (service: Service) => void] {
  const { service = 'bicimad' } = mapRoute.useSearch();
  const navigate = mapRoute.useNavigate();

  const setService = useCallback(
    (next: Service) =>
      navigate({
        search: (prev) => ({ ...prev, service: next, station: undefined, stop: undefined }),
        replace: true,
      }),
    [navigate],
  );

  return [service, setService];
}
