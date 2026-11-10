import type { ComponentProps } from 'react';
import { IconButton } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type IconButtonProps = ComponentProps<typeof IconButton>;

function ignorePress() {}

const CLOSE: IconButtonProps = {
  label: 'Cerrar la ficha de la estación',
  icon: 'close',
  onClick: ignorePress,
};

const FAVORITE: IconButtonProps = {
  label: 'Favorita',
  icon: 'star',
  pressedIcon: 'star-filled',
  iconTone: 'primary',
  onClick: ignorePress,
};

const SHOW_ON_MAP: IconButtonProps = {
  label: 'Ver en el mapa el autobús de la línea 27',
  icon: 'pin',
  iconTone: 'primary',
  variant: 'outline',
  onClick: ignorePress,
};

const LOCATE: IconButtonProps = {
  label: 'Centrar en mi posición',
  icon: 'locate',
  variant: 'floating',
  onClick: ignorePress,
};

function stateSpecimens(props: IconButtonProps): Specimen[] {
  return [
    { caption: 'Normal', piece: <IconButton {...props} /> },
    { caption: 'Desactivado', piece: <IconButton {...props} disabled /> },
    { caption: 'Ocupado', piece: <IconButton {...props} busy /> },
  ];
}

const GHOST_SPECIMENS: Specimen[] = [
  ...stateSpecimens(CLOSE),
  { caption: 'Alterna · off', piece: <IconButton {...FAVORITE} pressed={false} /> },
  { caption: 'Alterna · on (aria-pressed)', piece: <IconButton {...FAVORITE} pressed /> },
  {
    caption: 'tooltip · off',
    piece: <IconButton {...FAVORITE} pressed={false} tooltip="Añadir a favoritas" />,
  },
  {
    caption: 'tooltip · on',
    piece: <IconButton {...FAVORITE} pressed tooltip="Quitar de favoritas" />,
  },
];

const OUTLINE_SPECIMENS: Specimen[] = [
  ...stateSpecimens(SHOW_ON_MAP),
  { caption: 'Alterna · on', piece: <IconButton {...SHOW_ON_MAP} pressed /> },
];

const FLOATING_SPECIMENS: Specimen[] = [
  { caption: 'md', piece: <IconButton {...LOCATE} /> },
  { caption: 'md · desactivado', piece: <IconButton {...LOCATE} disabled /> },
  { caption: 'lg', piece: <IconButton {...LOCATE} size="lg" /> },
  { caption: 'lg · ocupado', piece: <IconButton {...LOCATE} size="lg" busy /> },
];

export function IconButtonSection() {
  return (
    <ReviewSection title="IconButton">
      <SpecimenRow title='variant="ghost"' specimens={GHOST_SPECIMENS} />
      <SpecimenRow title='variant="outline"' specimens={OUTLINE_SPECIMENS} />
      <SpecimenRow title='variant="floating" · md y lg' specimens={FLOATING_SPECIMENS} />
    </ReviewSection>
  );
}
