import type { KeyboardEvent, Ref } from 'react';
import { SearchField } from '@/shared/ui';
import type { SearchVariant } from '../model/types';

type SearchInputProps = {
  ref: Ref<HTMLInputElement>;
  variant: SearchVariant;
  itemLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onClear: () => void;
  placeholder?: string;
  busy: boolean;
  // Disables the box and replaces both the placeholder and the help.
  unavailableText?: string;
  // More description after the help, such as the no-results message.
  describedBy?: string;
};

const SHAPES = { inline: 'box', floating: 'pill' } as const satisfies Record<
  SearchVariant,
  'box' | 'pill'
>;

// Floating over the map, the field alone says what it is: label and help stay for assistive
// technology only. Disabled, the placeholder already shows why, so the help repeats it only for
// assistive technology, which does not reliably read a placeholder as a description.
export function SearchInput({
  variant,
  itemLabel,
  query,
  onQueryChange,
  placeholder,
  unavailableText,
  ...props
}: SearchInputProps) {
  const isFloating = variant === 'floating';
  const disabled = unavailableText !== undefined;

  return (
    <SearchField
      {...props}
      label={`Buscar ${itemLabel}`}
      labelVisible={!isFloating}
      value={query}
      onChange={onQueryChange}
      clearLabel="Borrar búsqueda"
      placeholder={unavailableText ?? placeholder}
      hint={unavailableText ?? `Busca por número de ${itemLabel}.`}
      hintVisible={!isFloating && !disabled}
      // Numbers can carry letters ('25A'), so no numeric keyboard.
      inputMode="text"
      disabled={disabled}
      shape={SHAPES[variant]}
    />
  );
}
