import { IconButton } from '@/shared/ui';
import { useFavorites } from '../model/useFavorites';

// A toggle button keeps the same name in both states (WAI-ARIA APG): aria-pressed tells
// whether it is on, and the design's action words go in the tooltip only.
export function FavoriteButton({ number }: { number: string }) {
  const { isFavorite, toggle } = useFavorites();
  const pressed = isFavorite(number);

  return (
    <IconButton
      label="Favorita"
      icon="star"
      pressedIcon="star-filled"
      pressed={pressed}
      tooltip={pressed ? 'Quitar de favoritas' : 'Añadir a favoritas'}
      iconTone="primary"
      onClick={() => toggle(number)}
    />
  );
}
