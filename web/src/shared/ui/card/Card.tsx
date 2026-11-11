import type { ReactNode } from 'react';
import { useCloseOnEscape } from '@/shared/lib';
import { Spinner } from '../spinner';
import { CardHeader } from './CardHeader';

type Elevation = 'float' | 'flat';
type CardTag = 'section' | 'article' | 'div';

type CardRootProps = {
  // The id of Card.Header's title, which names the card.
  titleId: string;
  elevation?: Elevation;
  as?: CardTag;
  onEscape?: () => void;
  children: ReactNode;
};

const ELEVATION_CLASSES = {
  float: 'rounded-float border border-line-subtle bg-surface p-4.5 shadow-float',
  flat: 'bg-transparent px-4',
} as const satisfies Record<Elevation, string>;

// The parts share nothing but the title id, so there is no context. Escape from any control
// inside calls onEscape, with no focus trap: the card is a region, not a dialog.
function CardRoot({
  titleId,
  elevation = 'float',
  as = 'section',
  onEscape,
  children,
}: CardRootProps) {
  const Root = as;
  const escapeRef = useCloseOnEscape(onEscape ?? ignoreEscape);
  return (
    <Root
      ref={onEscape ? escapeRef : undefined}
      aria-labelledby={as === 'div' ? undefined : titleId}
      data-elevation={elevation}
      className={`group/card flex flex-col gap-3.5 ${ELEVATION_CLASSES[elevation]}`}
    >
      {children}
    </Root>
  );
}

function ignoreEscape() {}

// aria-busy is not announced, so a busy body says what it waits for.
type Busy = { busy: boolean; busyLabel: string } | { busy?: false; busyLabel?: never };

type CardBodyProps = { children: ReactNode; separated?: boolean } & Busy;

function CardBody({ children, separated = false, busy = false, busyLabel }: CardBodyProps) {
  if (busy) {
    return (
      <div aria-busy="true" className="flex h-17.5 items-center justify-center">
        <Spinner size={24} className="text-primary" />
        <span className="sr-only">{busyLabel}</span>
      </div>
    );
  }
  return (
    <div className={separated ? 'border-t border-line-subtle pt-2' : undefined}>{children}</div>
  );
}

function CardFooter({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
