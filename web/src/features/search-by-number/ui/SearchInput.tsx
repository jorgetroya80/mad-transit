import type { KeyboardEvent, Ref } from 'react';
import { useId } from 'react';
import { ClearIcon } from '@/shared/ui';

type SearchInputProps = {
  ref: Ref<HTMLInputElement>;
  itemLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onClear: () => void;
};

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function ClearButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      aria-label="Borrar búsqueda"
      onClick={onClear}
      className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-control text-fg-muted hover:text-fg ${FOCUS_RING}`}
    >
      <ClearIcon className="size-5" />
    </button>
  );
}

export function SearchInput({
  ref,
  itemLabel,
  query,
  onQueryChange,
  onKeyDown,
  onClear,
}: SearchInputProps) {
  const id = useId();
  const helpId = `${id}-help`;

  return (
    <>
      <label htmlFor={id} className="text-sm font-medium text-fg-muted">
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
          className={`min-h-11 w-full rounded-control border border-input-line bg-surface pr-11 pl-3 text-fg [&::-webkit-search-cancel-button]:appearance-none ${FOCUS_RING}`}
        />
        {query ? <ClearButton onClear={onClear} /> : null}
      </div>
      <p id={helpId} className="text-sm text-fg-muted">
        {`Busca por número de ${itemLabel}.`}
      </p>
    </>
  );
}
