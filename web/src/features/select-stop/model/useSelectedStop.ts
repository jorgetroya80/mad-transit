import { getRouteApi } from '@tanstack/react-router';
import { useCallback } from 'react';

const mapRoute = getRouteApi('/');

export type SelectedStop = {
  number: string | undefined;
  select: (number: string) => void;
  clear: () => void;
};

// `?stop` is the only source of truth. Selecting pushes an entry so Back closes the detail;
// clearing replaces it, so Back after closing does not reopen the stop just closed.
export function useSelectedStop(): SelectedStop {
  const { stop } = mapRoute.useSearch();
  const navigate = mapRoute.useNavigate();

  const select = useCallback(
    (number: string) => navigate({ search: (prev) => ({ ...prev, stop: number }) }),
    [navigate],
  );
  const clear = useCallback(
    () => navigate({ search: (prev) => ({ ...prev, stop: undefined }), replace: true }),
    [navigate],
  );

  return { number: stop, select, clear };
}
