import { getRouteApi } from '@tanstack/react-router';
import { useCallback } from 'react';

const mapRoute = getRouteApi('/');

export type SelectedStop = {
  number: string | undefined;
  select: (number: string) => void;
};

// `?stop` is the only source of truth. Selecting pushes an entry so Back closes the detail.
export function useSelectedStop(): SelectedStop {
  const { stop } = mapRoute.useSearch();
  const navigate = mapRoute.useNavigate();

  const select = useCallback(
    (number: string) => navigate({ search: (prev) => ({ ...prev, stop: number }) }),
    [navigate],
  );

  return { number: stop, select };
}
