import type { ComponentProps } from 'react';
import { StarIcon } from '@/shared/ui';
import { useFavorites } from '../model/useFavorites';

type FavoriteButtonVariant = 'text' | 'icon';

type FavoriteButtonProps = Omit<ComponentProps<'button'>, 'children' | 'onClick'> & {
  number: string;
  variant?: FavoriteButtonVariant;
};

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function FavoriteButton({ variant = 'text', ...props }: FavoriteButtonProps) {
  return variant === 'icon' ? <IconFavoriteButton {...props} /> : <TextFavoriteButton {...props} />;
}

type VariantProps = Omit<FavoriteButtonProps, 'variant'>;

// A toggle button keeps the same name in both states (WAI-ARIA APG): aria-pressed tells
// whether it is on, so the label does not change to "Quitar…".
const NAME = 'Favorita';

function TextFavoriteButton({ number, className = '', ...props }: VariantProps) {
  const { isFavorite, toggle } = useFavorites();
  const pressed = isFavorite(number);

  return (
    <button
      type="button"
      {...props}
      aria-pressed={pressed}
      onClick={() => toggle(number)}
      className={`inline-flex min-h-11 min-w-11 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 font-medium text-fg hover:bg-chip aria-pressed:border-primary aria-pressed:bg-primary-soft ${FOCUS_RING} ${className}`}
    >
      <span aria-hidden="true" className="text-lg text-primary">
        {pressed ? '★' : '☆'}
      </span>
      {NAME}
    </button>
  );
}

// Same fixed name as the text variant; the design's action words go in the tooltip only.
function IconFavoriteButton({ number, className = '', ...props }: VariantProps) {
  const { isFavorite, toggle } = useFavorites();
  const pressed = isFavorite(number);

  return (
    <button
      type="button"
      {...props}
      aria-pressed={pressed}
      aria-label={NAME}
      title={pressed ? 'Quitar de favoritas' : 'Añadir a favoritas'}
      onClick={() => toggle(number)}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-control text-primary hover:bg-chip ${FOCUS_RING} ${className}`}
    >
      <StarIcon className={`size-6 ${pressed ? 'fill-current' : ''}`} />
    </button>
  );
}
