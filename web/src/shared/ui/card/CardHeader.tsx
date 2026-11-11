import type { ReactNode } from 'react';

type TitleLevel = 2 | 3;

type CardHeaderProps = {
  // The same id the Card gets, so it is named by this title.
  titleId: string;
  title: string;
  titleLevel?: TitleLevel;
  meta?: string;
  leadingAction?: ReactNode;
  cornerActions?: ReactNode;
  titleAction?: ReactNode;
};

const TITLE_TAGS = { 2: 'h2', 3: 'h3' } as const satisfies Record<TitleLevel, string>;

// A flat card's title is a step larger; the Card root marks its elevation for it.
const TITLE_CLASSES =
  'min-w-0 text-title break-words text-fg focus-visible:outline-none group-data-[elevation=flat]/card:text-[1.1875rem]';

type MetaRowProps = Pick<CardHeaderProps, 'meta' | 'cornerActions'>;

function MetaRow({ meta, cornerActions }: MetaRowProps) {
  if (!meta && !cornerActions) return null;
  return (
    <div className={`flex items-center gap-2 ${cornerActions ? '-mt-2.5 -mr-2.5' : ''}`}>
      {meta ? <p className="text-meta font-semibold text-fg-muted">{meta}</p> : null}
      {cornerActions ? <div className="ml-auto flex shrink-0">{cornerActions}</div> : null}
    </div>
  );
}

// Each action is a 44 px IconButton pulled 10 px toward its corner, so its icon lines up with the
// text. The DOM order (leading action, corner actions, title action) is the Tab order. The title
// takes programmatic focus (tabIndex -1, no ring and no tab stop), so a page can move the focus
// back to it.
export function CardHeader(props: CardHeaderProps) {
  const { titleId, title, titleLevel = 2, leadingAction, titleAction } = props;
  const Title = TITLE_TAGS[titleLevel];
  return (
    <div className="flex items-start gap-1">
      {leadingAction ? <div className="-ml-2.5 flex shrink-0">{leadingAction}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <MetaRow {...props} />
        <div className={`flex items-center gap-2 ${titleAction ? '-mr-2.5' : ''}`}>
          <Title id={titleId} tabIndex={-1} className={TITLE_CLASSES}>
            {title}
          </Title>
          {titleAction ? <div className="ml-auto flex shrink-0">{titleAction}</div> : null}
        </div>
      </div>
    </div>
  );
}
