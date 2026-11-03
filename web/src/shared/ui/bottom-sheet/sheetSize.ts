// Single source of the sheet size: the component styles and the overlap the map avoids
// both come from here.
export type SheetSnap = 'peek' | 'half' | 'full';

export const SHEET_HEIGHT_PX: Record<SheetSnap, number> = { peek: 112, half: 430, full: 700 };
// Kept free above the full sheet, so the floating search and mode stay in view on short screens.
export const FULL_SHEET_TOP_MARGIN_PX = 144;
export const HANDLE_HEIGHT_PX = 44;

// Every snap is capped like `full`, so `half` is never taller than it.
// dvh, not vh: 100vh ignores the Safari iOS toolbar and would hide the bottom of the sheet.
export function sheetHeight(snap: SheetSnap): string {
  return `min(${SHEET_HEIGHT_PX[snap]}px, 100dvh - ${FULL_SHEET_TOP_MARGIN_PX}px)`;
}
