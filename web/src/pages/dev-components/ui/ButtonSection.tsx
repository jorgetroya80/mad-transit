import type { ComponentProps } from 'react';
import { Button } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type ButtonProps = ComponentProps<typeof Button>;

function ignorePress() {}

const LOOKS: readonly { title: string; props: ButtonProps }[] = [
  {
    title: 'variant="primary"',
    props: { label: 'Reintentar', icon: 'refresh', onClick: ignorePress },
  },
  {
    title: 'variant="secondary"',
    props: { variant: 'secondary', label: 'Ver horarios', icon: 'clock', onClick: ignorePress },
  },
  {
    title: 'variant="outline" · tone="warning"',
    props: {
      variant: 'outline',
      tone: 'warning',
      label: 'Reintentar',
      icon: 'refresh',
      onClick: ignorePress,
    },
  },
  {
    title: 'variant="outline" · tone="danger"',
    props: {
      variant: 'outline',
      tone: 'danger',
      label: 'Reintentar',
      icon: 'refresh',
      onClick: ignorePress,
    },
  },
];

function stateSpecimens(props: ButtonProps): Specimen[] {
  return [
    { caption: 'Normal', piece: <Button {...props} /> },
    { caption: 'Desactivado', piece: <Button {...props} disabled /> },
    { caption: 'Ocupado', piece: <Button {...props} busy /> },
  ];
}

const SIZE_SPECIMENS: Specimen[] = [
  { caption: 'sm · 40', piece: <Button size="sm" label="Activar" onClick={ignorePress} /> },
  { caption: 'md · 44', piece: <Button label="Volver a la lista" onClick={ignorePress} /> },
  {
    caption: 'lg · 48',
    piece: <Button size="lg" icon="refresh" label="Reintentar" onClick={ignorePress} />,
  },
];

export function ButtonSection() {
  return (
    <ReviewSection title="Button">
      {LOOKS.map(({ title, props }) => (
        <SpecimenRow key={title} title={title} specimens={stateSpecimens(props)} />
      ))}
      <SpecimenRow title="Tamaños" specimens={SIZE_SPECIMENS} />
    </ReviewSection>
  );
}
