// Single source of the sheet size: the component styles and the overlap the map avoids
// both come from here.
export type SheetSnap = 'hidden' | 'half';

export const SHEET_HEIGHT_PX: Record<SheetSnap, number> = { hidden: 56, half: 430 };
// Kept free above the sheet, so the floating search and mode stay in view on short screens.
export const SHEET_TOP_MARGIN_PX = 166;
export const HANDLE_HEIGHT_PX = 44;

// dvh, not vh: 100vh ignores the Safari iOS toolbar and would hide the bottom of the sheet.
export function sheetHeight(snap: SheetSnap): string {
  return `min(${SHEET_HEIGHT_PX[snap]}px, 100dvh - ${SHEET_TOP_MARGIN_PX}px)`;
}
