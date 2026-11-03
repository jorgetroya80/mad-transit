import { searchStatusText } from '../lib/searchStatusText';
import type { SearchVariant } from '../model/types';
import type { SearchSources } from '../model/useNumberSearch';
import { useNumberSearch } from '../model/useNumberSearch';
import { useResultsKeyboard } from '../model/useResultsKeyboard';
import { ResultList } from './ResultList';
import { SearchInput } from './SearchInput';
import { SourcePicker } from './SourcePicker';

type SearchByNumberProps = {
  sources: SearchSources;
  variant?: SearchVariant;
};

const STATUS_CLASS = 'text-sm text-fg-muted empty:hidden';

const LAYOUTS = {
  inline: { root: 'flex flex-col gap-2', status: STATUS_CLASS },
  floating: {
    root: 'relative',
    status: `rounded-control bg-surface px-3 py-2 shadow-float ${STATUS_CLASS}`,
  },
} as const satisfies Record<SearchVariant, { root: string; status: string }>;

export function SearchByNumber({ sources, variant = 'inline' }: SearchByNumberProps) {
  const search = useNumberSearch(sources);
  const { source, query, results } = search;
  const { inputRef, listRef, onInputKeyDown, onResultKeyDown, clearAndFocusInput } =
    useResultsKeyboard({ results, query, onChoose: search.choose, onClear: search.clearQuery });
  const layout = LAYOUTS[variant];

  const dropdown = (
    <>
      {results.length > 0 ? (
        <ResultList
          ref={listRef}
          results={results}
          onChoose={search.choose}
          onResultKeyDown={onResultKeyDown}
        />
      ) : null}
      <output className={layout.status}>{searchStatusText(source, query, results.length)}</output>
    </>
  );

  return (
    <div className={layout.root}>
      {sources.length > 1 ? (
        <SourcePicker sources={sources} selectedId={source.id} onChange={search.selectSource} />
      ) : null}
      <SearchInput
        ref={inputRef}
        variant={variant}
        itemLabel={source.itemLabel}
        query={query}
        onQueryChange={search.setQuery}
        onKeyDown={onInputKeyDown}
        onClear={clearAndFocusInput}
      />
      {/* Floating, the results open over what follows (the map) instead of pushing it down. */}
      {variant === 'floating' ? (
        <div className="absolute inset-x-0 top-full z-10 mt-2 flex flex-col gap-2">{dropdown}</div>
      ) : (
        dropdown
      )}
    </div>
  );
}
