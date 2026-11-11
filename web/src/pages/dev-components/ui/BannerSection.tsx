import type { ComponentProps } from 'react';
import { Banner } from '@/shared/ui';
import { LiveRegionNote } from './LiveRegionNote';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type BannerProps = ComponentProps<typeof Banner>;
type BannerAction = NonNullable<BannerProps['action']>;

const CARD_WIDTH = 'w-105 max-w-[calc(100vw-3rem)]';
const BAR_WIDTH = 'w-225 max-w-[calc(100vw-3rem)]';

function ignorePress() {}

function locationAction(state: Partial<BannerAction> = {}): BannerAction {
  return { label: 'Usar mi ubicación', onClick: ignorePress, ...state };
}

const RETRY: BannerAction = { label: 'Reintentar', onClick: ignorePress };

const NO_LOCATION: BannerProps = {
  tone: 'info',
  icon: 'pin',
  message: 'Mostrando estaciones cerca de la Puerta del Sol.',
};

const STALE: BannerProps = {
  tone: 'warning',
  icon: 'clock',
  title: 'No hemos podido actualizar.',
  message: 'Datos de las 10:42.',
  action: RETRY,
};

const OFFLINE: BannerProps = {
  tone: 'inverse',
  icon: 'wifi-off',
  title: 'Sin conexión a internet.',
  message: 'Se actualizará solo al volver a conectarte.',
};

function card(props: BannerProps) {
  return (
    <div className={CARD_WIDTH}>
      <Banner {...props} />
    </div>
  );
}

const TONE_SPECIMENS: Specimen[] = [
  {
    caption: 'info · announce="polite"',
    piece: card({ ...NO_LOCATION, action: locationAction(), announce: 'polite' }),
  },
  { caption: 'warning', piece: card(STALE) },
  {
    caption: 'warning · sin acción',
    piece: card({
      tone: 'warning',
      icon: 'clock',
      title: 'Llegadas no disponibles por ahora.',
      message: 'Los horarios de abajo siguen siendo válidos.',
    }),
  },
  {
    caption: 'danger',
    piece: card({
      tone: 'danger',
      icon: 'cloud-alert',
      message: 'No se pudo cargar la estación.',
      action: RETRY,
    }),
  },
  { caption: 'inverse', piece: card(OFFLINE) },
];

const ACTION_SPECIMENS: Specimen[] = [
  { caption: 'Normal', piece: card({ ...NO_LOCATION, action: locationAction() }) },
  { caption: 'Ocupado', piece: card({ ...NO_LOCATION, action: locationAction({ busy: true }) }) },
  {
    caption: 'Desactivado',
    piece: card({ ...NO_LOCATION, action: locationAction({ disabled: true }) }),
  },
  { caption: 'inverse · anillo de foco blanco', piece: card({ ...OFFLINE, action: RETRY }) },
];

const BAR_SPECIMENS: Specimen[] = [
  {
    caption: 'inverse · bar',
    piece: (
      <div className={BAR_WIDTH}>
        <Banner {...OFFLINE} layout="bar" />
      </div>
    ),
  },
];

const FLOAT_SPECIMENS: Specimen[] = [
  {
    caption: 'info · float',
    piece: (
      <div className={CARD_WIDTH}>
        <Banner {...NO_LOCATION} layout="float" />
      </div>
    ),
  },
  {
    caption: 'warning · float',
    piece: (
      <div className={CARD_WIDTH}>
        <Banner {...STALE} layout="float" />
      </div>
    ),
  },
];

export function BannerSection() {
  return (
    <ReviewSection title="Banner">
      <LiveRegionNote live='announce="polite"' quiet='announce="none"' />
      <SpecimenRow title='Tonos · layout="card"' specimens={TONE_SPECIMENS} />
      <SpecimenRow title="Estados de la acción (Button sm)" specimens={ACTION_SPECIMENS} />
      <SpecimenRow title='layout="bar" (franja de escritorio)' specimens={BAR_SPECIMENS} />
      <SpecimenRow title='layout="float" (sobre el mapa en móvil)' specimens={FLOAT_SPECIMENS} />
    </ReviewSection>
  );
}
