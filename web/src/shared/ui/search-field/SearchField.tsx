import { type KeyboardEvent, type Ref, useId, useRef } from 'react';
import { Icon } from '../icons';
import { IconButton } from '../icon-button';
import { Spinner } from '../spinner';

type SearchFieldShape = 'box' | 'pill';
type FieldState = 'normal' | 'error' | 'disabled';

type SearchFieldProps = {
  ref?: Ref<HTMLInputElement>;
  label: string;
  labelVisible?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearLabel: string;
  onClear?: () => void;
  hint?: string;
  // Hidden, the hint still describes the box for assistive technology.
  hintVisible?: boolean;
  // Replaces the hint. Not a live region: the results announce the outcome.
  error?: string;
  inputMode?: 'search' | 'numeric' | 'text';
  // Called after the field's own Escape handling, which marks the event as handled.
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  // Ids of more descriptions, read after the hint or the error.
  describedBy?: string;
  busy?: boolean;
  disabled?: boolean;
  shape?: SearchFieldShape;
};

const SHAPE_CLASSES = {
  box: 'h-12 rounded-control',
  pill: 'h-11 rounded-full shadow-pill',
} as const satisfies Record<SearchFieldShape, string>;

// In the 44 px pill, 2 px from the edge puts the 40 px button's center on the end's center.
const CLEAR_POSITION_CLASSES = {
  box: 'right-1',
  pill: 'right-0.5',
} as const satisfies Record<SearchFieldShape, string>;

// The 1 px border plus a 1 px inner ring draws the 2 px border without moving the text.
const BOX_STATE_CLASSES = {
  normal:
    'bg-surface border-input-line hover:border-fg-muted focus:border-primary focus:inset-ring-1 focus:inset-ring-primary',
  error: 'bg-surface border-tone-danger-line inset-ring-1 inset-ring-tone-danger-line',
  disabled: 'bg-surface-disabled border-line-strong',
} as const satisfies Record<FieldState, string>;

const MAGNIFIER_CLASSES = {
  normal: 'text-fg-muted',
  error: 'text-tone-danger-icon',
  disabled: 'text-fg-muted',
} as const satisfies Record<FieldState, string>;

function fieldStateOf(error: string | undefined, disabled: boolean): FieldState {
  if (disabled) return 'disabled';
  return error ? 'error' : 'normal';
}

function Magnifier({ busy, state }: { busy: boolean; state: FieldState }) {
  const position = 'pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2';
  if (busy) return <Spinner className={`${position} text-primary`} />;
  return <Icon name="search" className={`${position} ${MAGNIFIER_CLASSES[state]}`} />;
}

type FieldMessageProps = Pick<SearchFieldProps, 'hint' | 'hintVisible' | 'error'> & { id: string };

function FieldMessage({ id, hint, hintVisible = true, error }: FieldMessageProps) {
  if (error) {
    return (
      <p id={id} className="flex items-center gap-1.5 text-meta text-tone-danger-label">
        <Icon name="info" size={16} />
        {error}
      </p>
    );
  }
  if (!hint) return null;
  return (
    <p id={id} className={hintVisible ? 'text-meta text-fg-muted' : 'sr-only'}>
      {hint}
    </p>
  );
}

type ClearableInput = Pick<
  SearchFieldProps,
  'ref' | 'value' | 'onChange' | 'onClear' | 'disabled' | 'onKeyDown'
>;

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

// Clearing, by button or by Escape, leaves the focus in the box: the button disappears with the
// text it cleared.
function useClearableInput({ ref, value, onChange, onClear, disabled, onKeyDown }: ClearableInput) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canClear = value !== '' && disabled !== true;

  function setInputRef(node: HTMLInputElement | null) {
    inputRef.current = node;
    assignRef(ref, node);
  }

  function clear() {
    if (onClear) onClear();
    else onChange('');
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && canClear) {
      event.preventDefault();
      clear();
    }
    onKeyDown?.(event);
  }

  return { setInputRef, canClear, clear, handleKeyDown };
}

function inputClassesOf(shape: SearchFieldShape, state: FieldState, canClear: boolean) {
  return [
    'focus-ring w-full border pl-11 text-input text-fg placeholder:text-fg-muted',
    '[&::-webkit-search-cancel-button]:appearance-none',
    canClear ? 'pr-13' : 'pr-3.5',
    SHAPE_CLASSES[shape],
    BOX_STATE_CLASSES[state],
  ].join(' ');
}

type SearchBoxProps = SearchFieldProps & { inputId: string };

// The browser's own clear button is hidden: ours has a name and returns the focus to the box.
function SearchBox(props: SearchBoxProps) {
  const { inputId, describedBy, value, onChange, placeholder, clearLabel, error } = props;
  const { inputMode = 'search', busy = false, disabled = false, shape = 'box' } = props;
  const { setInputRef, canClear, clear, handleKeyDown } = useClearableInput(props);
  const state = fieldStateOf(error, disabled);

  return (
    <div className="relative">
      <Magnifier busy={busy} state={state} />
      <input
        ref={setInputRef}
        id={inputId}
        type="search"
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className={inputClassesOf(shape, state, canClear)}
      />
      {canClear && (
        // Inset from the box's edges so its hover and its focus ring stay inside the box; in the
        // pill it is round and centered on the rounded end.
        <span
          className={`absolute top-1/2 -translate-y-1/2 [--focus-ring-offset:-4px] ${CLEAR_POSITION_CLASSES[shape]}`}
        >
          <IconButton
            label={clearLabel}
            icon="close"
            iconSize={18}
            size="sm"
            round={shape === 'pill'}
            onClick={clear}
          />
        </span>
      )}
    </div>
  );
}

function describedByOf(messageId: string | undefined, describedBy: string | undefined) {
  const ids = [messageId, describedBy].filter(Boolean).join(' ');
  return ids || undefined;
}

export function SearchField(props: SearchFieldProps) {
  const { label, labelVisible = true, hint, hintVisible, error, describedBy } = props;
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const ownMessageId = error || hint ? messageId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={labelVisible ? 'text-body font-semibold text-fg' : 'sr-only'}
      >
        {label}
      </label>
      <SearchBox
        {...props}
        inputId={inputId}
        describedBy={describedByOf(ownMessageId, describedBy)}
      />
      <FieldMessage id={messageId} hint={hint} hintVisible={hintVisible} error={error} />
    </div>
  );
}
