import { type ReactNode, type Ref, useId } from 'react';
import { HANDLE_HEIGHT_PX, SHEET_HEIGHT_PX, sheetHeight, type SheetSnap } from './sheetSize';

type BottomSheetProps = {
  label: string;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  // Names the handle at half, which hides the sheet: «Ocultar lista», for example.
  hideLabel: string;
  // The strip's one visible line at hidden, which is also its accessible name.
  collapsedLabel: ReactNode;
  header?: ReactNode;
  // Lets the page focus the handle, the one control left when the sheet is hidden.
  handleRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

const OTHER_SNAP = { hidden: 'half', half: 'hidden' } as const satisfies Record<
  SheetSnap,
  SheetSnap
>;

// Inline styles, not Tailwind classes: classes cannot be built from the shared size constants.
const stripStyle = { height: SHEET_HEIGHT_PX.hidden };
const handleStyle = {
  hidden: { height: SHEET_HEIGHT_PX.hidden },
  half: { height: HANDLE_HEIGHT_PX },
};

// The sheet overlays the page and animates its height between the snaps. The root is an
// in-flow strip as tall as `hidden`, so the hidden sheet covers nothing above it (e.g. the map
// attribution).
export function BottomSheet({
  label,
  snap,
  onSnapChange,
  hideLabel,
  collapsedLabel,
  header,
  handleRef,
  children,
}: BottomSheetProps) {
  const bodyId = useId();
  const isHidden = snap === 'hidden';

  return (
    <div className="shrink-0" style={stripStyle}>
      <div
        style={{ height: sheetHeight(snap) }}
        className="fixed inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-sheet bg-surface shadow-sheet transition-[height] duration-320 ease-sheet motion-reduce:transition-none"
      >
        <SheetHandle
          snap={snap}
          onSnapChange={onSnapChange}
          hideLabel={hideLabel}
          collapsedLabel={collapsedLabel}
          bodyId={bodyId}
          handleRef={handleRef}
        />
        {/* Visibility switches at the end of the shrink, so header and body stay painted while
          the sheet closes over them; inert keeps them out of focus and assistive technology. */}
        <section
          aria-label={label}
          inert={isHidden}
          className={`flex min-h-0 flex-1 flex-col transition-[visibility] duration-320 motion-reduce:transition-none ${isHidden ? 'invisible' : 'visible'}`}
        >
          {header}
          <div id={bodyId} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

type SheetHandleProps = Pick<
  BottomSheetProps,
  'snap' | 'onSnapChange' | 'hideLabel' | 'collapsedLabel' | 'handleRef'
> & { bodyId: string };

// One button in both snaps, so it keeps the focus as it toggles: a bar named by `hideLabel` at
// half, and at hidden the whole strip, named by its visible text.
function SheetHandle({
  snap,
  onSnapChange,
  hideLabel,
  collapsedLabel,
  bodyId,
  handleRef,
}: SheetHandleProps) {
  const isHidden = snap === 'hidden';
  return (
    <button
      ref={handleRef}
      type="button"
      aria-label={isHidden ? undefined : hideLabel}
      aria-expanded={!isHidden}
      aria-controls={bodyId}
      onClick={() => onSnapChange(OTHER_SNAP[snap])}
      style={handleStyle[snap]}
      className="flex w-full shrink-0 flex-col items-center justify-center gap-2 px-4 focus-ring [--focus-ring-offset:-2px]"
    >
      <span aria-hidden="true" className="h-1 w-10 shrink-0 rounded-full bg-handle" />
      {isHidden ? (
        <span className="max-w-full truncate text-body font-semibold text-fg">
          {collapsedLabel}
        </span>
      ) : null}
    </button>
  );
}
