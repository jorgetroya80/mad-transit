import type { SearchItem, SearchSource, SearchVariant } from '../model/types';

type NoResultsProps = {
  messageId: string;
  variant: SearchVariant;
  source: Pick<SearchSource, 'itemLabel' | 'itemLabelPlural' | 'suggestion'>;
  query: string;
  onChoose: (item: SearchItem) => void;
  onShowNearby: () => void;
};

const FRAMES = {
  inline: 'rounded-control border border-line-strong bg-surface p-3',
  floating: 'rounded-control bg-surface p-3 shadow-float',
} as const satisfies Record<SearchVariant, string>;

const CHIP =
  'min-h-11 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-fg hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// Only the message is live (an <output> holds no heading or buttons): the suggestions are
// reached with Tab, not read out on every keystroke. The search sits right under the page's h1
// on both screens, so its heading is an h2.
export function NoResults({
  messageId,
  variant,
  source,
  query,
  onChoose,
  onShowNearby,
}: NoResultsProps) {
  const { suggestion } = source;
  return (
    <div className={`flex flex-col gap-3 ${FRAMES[variant]}`}>
      <output id={messageId} className="flex flex-col gap-1">
        <span className="font-medium text-fg">{`No hay ninguna ${source.itemLabel} «${query}»`}</span>{' '}
        <span className="text-sm text-fg-muted">{`Revisa el número que aparece en la ${source.itemLabel}.`}</span>
      </output>
      <h2 className="text-sm font-semibold text-fg">Prueba con</h2>
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
