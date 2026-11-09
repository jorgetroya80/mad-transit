export type SearchItem = {
  /** What the user types: '25A' (station), '1234' (stop). */
  number: string;
  title: string;
  subtitle?: string;
};

export type SearchSource = {
  id: string;
  label: string;
  itemLabel: string;
  /** Spanish plurals are irregular ('estación' → 'estaciones'), so each source gives its own. */
  itemLabelPlural: string;
  items: readonly SearchItem[];
  status: 'loading' | 'ready' | 'error';
  /** Set while the source cannot be searched at all: the box is disabled and says why. */
  unavailableText?: string;
  /** A hint inside a searchable box, such as that only saved items are searched. */
  placeholder?: string;
  onSelect: (number: string) => void;
};

/** `floating`: a round field over the map, with the results opening over it. */
export type SearchVariant = 'inline' | 'floating';
