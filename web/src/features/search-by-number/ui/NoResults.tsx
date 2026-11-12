import { EmptyState } from '@/shared/ui';
import type { SearchItem, SearchSource, SearchVariant } from '../model/types';

type NoResultsProps = {
  messageId: string;
  variant: SearchVariant;
  source: Pick<SearchSource, 'itemLabel' | 'itemLabelPlural' | 'suggestion'>;
  query: string;
  onChoose: (item: SearchItem) => void;
  onShowNearby: () => void;
};

// Beside the panel it sits on the panel's own surface; over the map it needs its own.
const FRAMES = {
  inline: '',
  floating: 'rounded-control bg-surface shadow-float',
} as const satisfies Record<SearchVariant, string>;

const CHIP =
  'min-h-11 rounded-full border border-line-strong bg-surface px-4 text-body font-semibold text-fg hover:bg-chip focus-ring';

type SuggestionsProps = Pick<NoResultsProps, 'source' | 'onChoose' | 'onShowNearby'>;

function Suggestions({ source, onChoose, onShowNearby }: SuggestionsProps) {
  const { suggestion } = source;
  return (
    <div className="flex flex-col gap-2 px-4 pb-4">
      <h3 className="text-meta font-semibold text-fg-muted">Prueba con</h3>
      <div className="flex flex-wrap gap-2">
        {suggestion ? (
          <button type="button" onClick={() => onChoose(suggestion)} className={CHIP}>
            {`${suggestion.number} · ${suggestion.title}`}
          </button>
        ) : null}
        <button type="button" onClick={onShowNearby} className={CHIP}>
          {`Ver ${source.itemLabelPlural} cercanas`}
        </button>
      </div>
    </div>
  );
}

// Only the heading and the message are live: the suggestions are reached with Tab, not read out
// on every keystroke. The search sits right under the page's h1 on both screens, so its heading
// is an h2.
export function NoResults({ messageId, variant, source, query, ...actions }: NoResultsProps) {
  return (
    <div className={`flex flex-col ${FRAMES[variant]}`}>
      <EmptyState
        tone="neutral"
        icon="search"
        size="sm"
        announce="status"
        messageId={messageId}
        title={`No hay ninguna ${source.itemLabel} «${query}»`}
        message={`Revisa el número que aparece en la ${source.itemLabel}.`}
      />
      <Suggestions source={source} {...actions} />
    </div>
  );
}
