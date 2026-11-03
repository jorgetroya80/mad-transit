import type { KeyboardEvent, Ref } from 'react';
import { useId } from 'react';
import { ClearIcon } from '@/shared/ui';
import type { SearchVariant } from '../model/types';

type SearchInputProps = {
  ref: Ref<HTMLInputElement>;
  variant: SearchVariant;
  itemLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onClear: () => void;
};

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// Floating over the map, the field alone says what it is: label and help stay for assistive
// technology only.
const VARIANTS = {
  inline: {
    label: 'text-sm font-medium text-fg-muted',
    input: 'min-h-11 rounded-control border border-input-line pl-3',
    help: 'text-sm text-fg-muted',
    clear: 'rounded-control',
  },
  floating: {
    label: 'sr-only',
    input: 'h-12.5 rounded-full pl-5 shadow-float',
    help: 'sr-only',
    clear: 'rounded-full',
  },
} as const satisfies Record<SearchVariant, Record<string, string>>;

function ClearButton({ onClear, className }: { onClear: () => void; className: string }) {
  return (
    <button
      type="button"
      aria-label="Borrar búsqueda"
      onClick={onClear}
      className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center text-fg-muted hover:text-fg ${className} ${FOCUS_RING}`}
    >
      <ClearIcon className="size-5" />
    </button>
  );
}

export function SearchInput({
  ref,
  variant,
  itemLabel,
  query,
  onQueryChange,
  onKeyDown,
  onClear,
}: SearchInputProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const styles = VARIANTS[variant];

  return (
    <>
      <label htmlFor={id} className={styles.label}>
        {`Buscar ${itemLabel}`}
      </label>
      <div className="relative">
        {/* The browser's own clear button is hidden: ours has a name and returns the focus. */}
        <input
          ref={ref}
          id={id}
          type="search"
          aria-describedby={helpId}
          // Numbers can carry letters ('25A'), so no numeric keyboard.
          inputMode="text"
          autoComplete="off"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
          className={`w-full bg-surface pr-11 text-fg [&::-webkit-search-cancel-button]:appearance-none ${styles.input} ${FOCUS_RING}`}
        />
        {query ? <ClearButton onClear={onClear} className={styles.clear} /> : null}
      </div>
      <p id={helpId} className={styles.help}>
        {`Busca por número de ${itemLabel}.`}
      </p>
    </>
  );
}
