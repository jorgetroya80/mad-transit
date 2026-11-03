import { type RefObject, useCallback, useEffect, useRef } from 'react';
import {
  findFirstSectionHeading,
  findRow,
  type RowOrigin,
  rowOriginOf,
} from '../lib/stationListFocus';

// Hidden (inert) at peek, the list cannot hold the focus: no target then.
function listFocusTarget(panel: HTMLElement, origin: RowOrigin | undefined, closedStation: string) {
  if (panel.closest('[inert]')) return undefined;
  const row = origin?.number === closedStation ? findRow(panel, origin) : undefined;
  return row ?? findFirstSectionHeading(panel);
}

// Where the focus goes when it would be lost in the mobile sheet, which swaps the list and the
// detail in place and can hide its body.
type SheetFocusTargets = {
  // A row that opens the detail unmounts with the list.
  detailHeading: RefObject<HTMLElement | null>;
  // Takes the focus back when the list cannot, as when it comes back hidden at peek.
  listFallback: RefObject<HTMLElement | null>;
};

// The list unmounts while a detail is open, so the row a detail came from is remembered here
// (section + number, from the click) and focused again once the list is back. A detail opened
// from the map, the search or a link has no row: the first list heading gets the focus, which
// announces where the user is without opening the on-screen keyboard as the search box would.
// Without `sheet` (desktop) opening a detail never moves the focus.
export function useListFocusReturn(openStation: string | undefined, sheet?: SheetFocusTargets) {
  const panelRef = useRef<HTMLElement | null>(null);
  const originRef = useRef<RowOrigin | undefined>(undefined);
  const lastOpenRef = useRef(openStation);
  const { detailHeading, listFallback } = sheet ?? {};

  // Listens to the rows' clicks bubbling up (Enter and Space on a button click it too), so the
  // list needs no callback for it. The panel remounts when the layout crosses md.
  const attachPanel = useCallback((panel: HTMLElement | null) => {
    if (!panel) return undefined;
    const recordOrigin = (event: Event) => {
      const origin = rowOriginOf(event.target);
      if (origin) originRef.current = origin;
    };
    panelRef.current = panel;
    panel.addEventListener('click', recordOrigin);
    return () => {
      panel.removeEventListener('click', recordOrigin);
      panelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const previousStation = lastOpenRef.current;
    lastOpenRef.current = openStation;

    function returnFocusToList(closedStation: string) {
      const origin = originRef.current;
      originRef.current = undefined;
      const panel = panelRef.current;
      if (!panel) return;
      (listFocusTarget(panel, origin, closedStation) ?? listFallback?.current)?.focus();
    }

    if (previousStation === undefined && openStation !== undefined) {
      if (originRef.current?.number === openStation) detailHeading?.current?.focus();
    } else if (previousStation !== undefined && openStation === undefined) {
      returnFocusToList(previousStation);
    }
  }, [openStation, detailHeading, listFallback]);

  return attachPanel;
}
