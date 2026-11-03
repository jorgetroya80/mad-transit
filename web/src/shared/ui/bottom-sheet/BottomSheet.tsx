import { type ReactNode, type Ref, useId } from 'react';
import { HANDLE_HEIGHT_PX, SHEET_HEIGHT_PX, sheetHeight, type SheetSnap } from './sheetSize';

type BottomSheetProps = {
  label: string;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  // The page picks the cycle, so the list and the station detail can step differently.
  nextSnap: Record<SheetSnap, SheetSnap>;
  handleLabel: string;
  header?: ReactNode;
  // Given by the page when a header control also points at the body (aria-controls).
  bodyId?: string;
  // Lets the page focus the handle, the one control left when the body is inert at peek.
  handleRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

// Inline styles, not Tailwind classes: classes cannot be built from the shared size constants.
const stripStyle = { height: SHEET_HEIGHT_PX.peek };
const handleStyle = { height: HANDLE_HEIGHT_PX };

// The sheet overlays the page and animates its height between the snaps. The root is an
// in-flow strip as tall as `peek`, so the sheet at peek covers nothing above it (e.g. the map
// attribution).
export function BottomSheet({
  label,
  snap,
  onSnapChange,
  nextSnap,
  handleLabel,
  header,
  bodyId: givenBodyId,
  handleRef,
  children,
}: BottomSheetProps) {
  const generatedBodyId = useId();
  const bodyId = givenBodyId ?? generatedBodyId;
  const isPeek = snap === 'peek';

  return (
    <div className="shrink-0" style={stripStyle}>
      <div
        style={{ height: sheetHeight(snap) }}
        className="fixed inset-x-0 bottom-0 z-10 flex flex-col rounded-t-sheet bg-surface shadow-sheet transition-[height] duration-320 ease-sheet motion-reduce:transition-none"
      >
        <button
          ref={handleRef}
          type="button"
          aria-label={handleLabel}
          aria-expanded={!isPeek}
          aria-controls={bodyId}
          onClick={() => onSnapChange(nextSnap[snap])}
          style={handleStyle}
          className="flex w-full shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-handle" />
        </button>
        <section aria-label={label} className="flex min-h-0 flex-1 flex-col">
          {header}
          {/* Visibility switches at the end of the shrink, so the body stays painted while
            the sheet closes over it; inert keeps it out of focus and assistive technology. */}
          <div
            id={bodyId}
            inert={isPeek}
            className={`min-h-0 flex-1 overflow-y-auto px-4 pb-4 transition-[visibility] duration-320 motion-reduce:transition-none ${isPeek ? 'invisible' : 'visible'}`}
          >
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
