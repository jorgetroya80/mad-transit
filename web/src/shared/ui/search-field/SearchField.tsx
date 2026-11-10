import { type KeyboardEvent, useId, useRef } from 'react';
import { Icon } from '../icons';
import { IconButton } from '../icon-button';
import { Spinner } from '../spinner';

type SearchFieldShape = 'box' | 'pill';
type FieldState = 'normal' | 'error' | 'disabled';

type SearchFieldProps = {
  label: string;
  labelVisible?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearLabel: string;
  onClear?: () => void;
  hint?: string;
  // Replaces the hint. Not a live region: the results announce the outcome.
  error?: string;
  inputMode?: 'search' | 'numeric';
  busy?: boolean;
  disabled?: boolean;
  shape?: SearchFieldShape;
};

const SHAPE_CLASSES = {
  box: 'h-12 rounded-control',
  pill: 'h-11 rounded-full shadow-pill',
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

type FieldMessageProps = { id: string; hint?: string; error?: string };

function FieldMessage({ id, hint, error }: FieldMessageProps) {
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
    <p id={id} className="text-meta text-fg-muted">
      {hint}
    </p>
  );
}

type ClearableInput = Pick<SearchFieldProps, 'value' | 'onChange' | 'onClear' | 'disabled'>;

// Clearing, by button or by Escape, leaves the focus in the box: the button disappears with the
// text it cleared.
function useClearableInput({ value, onChange, onClear, disabled }: ClearableInput) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canClear = value !== '' && disabled !== true;

  function clear() {
    if (onClear) onClear();
    else onChange('');
    inputRef.current?.focus();
  }

  function clearOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape' || !canClear) return;
    event.preventDefault();
    clear();
  }

  return { inputRef, canClear, clear, clearOnEscape };
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

type SearchBoxProps = SearchFieldProps & { inputId: string; describedBy?: string };

// The browser's own clear button is hidden: ours has a name and returns the focus to the box.
function SearchBox(props: SearchBoxProps) {
  const { inputId, describedBy, value, onChange, placeholder, clearLabel, error } = props;
  const { inputMode = 'search', busy = false, disabled = false, shape = 'box' } = props;
  const { inputRef, canClear, clear, clearOnEscape } = useClearableInput(props);
  const state = fieldStateOf(error, disabled);

  return (
    <div className="relative">
      <Magnifier busy={busy} state={state} />
      <input
        ref={inputRef}
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
        onKeyDown={clearOnEscape}
        className={inputClassesOf(shape, state, canClear)}
      />
      {canClear && (
        // The button touches the box's edge, so its focus ring is drawn inside it.
        <span className="absolute top-1/2 right-0 -translate-y-1/2 [--focus-ring-offset:-4px]">
          <IconButton label={clearLabel} icon="close" iconSize={18} onClick={clear} />
        </span>
      )}
    </div>
  );
}

export function SearchField(props: SearchFieldProps) {
  const { label, labelVisible = true, hint, error } = props;
  const inputId = useId();
  const messageId = `${inputId}-message`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={labelVisible ? 'text-body font-semibold text-fg' : 'sr-only'}
      >
        {label}
      </label>
      <SearchBox {...props} inputId={inputId} describedBy={error || hint ? messageId : undefined} />
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  );
}
