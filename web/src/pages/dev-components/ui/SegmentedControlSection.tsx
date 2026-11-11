import { type ComponentProps, useState } from 'react';
import { SegmentedControl } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type SegmentedControlProps = ComponentProps<typeof SegmentedControl>;
type SpecimenProps = Omit<SegmentedControlProps, 'onChange'>;

const SERVICE: SpecimenProps = {
  label: 'Servicio',
  options: [
    { value: 'bicimad', label: 'BiciMAD', icon: 'bike' },
    { value: 'bus', label: 'Bus', icon: 'bus' },
  ],
  value: 'bicimad',
};

const NEED: SpecimenProps = {
  label: '¿Qué quieres hacer?',
  variant: 'cards',
  options: [
    { value: 'bikes', label: 'Sacar bici', description: 'Bicis disponibles', icon: 'bike' },
    { value: 'docks', label: 'Dejar bici', description: 'Anclajes libres', icon: 'dock' },
  ],
  value: 'bikes',
};

const MODE: SpecimenProps = {
  ...NEED,
  variant: 'pill',
  options: [
    { value: 'bikes', label: 'Sacar bici' },
    { value: 'docks', label: 'Dejar bici' },
  ],
};

const DIRECTION: SpecimenProps = {
  label: 'Sentido',
  variant: 'pill',
  options: [
    { value: 'sol', label: 'Hacia Sol' },
    { value: 'chamartin', label: 'Hacia Chamartín' },
  ],
  value: 'sol',
};

// Each specimen keeps its own choice, so the board can be tried with the mouse and the keyboard.
function LiveSegmentedControl(props: SpecimenProps) {
  const [value, setValue] = useState(props.value);
  return <SegmentedControl {...props} value={value} onChange={setValue} />;
}

function stateSpecimens(props: SpecimenProps): Specimen[] {
  return [
    { caption: 'Normal', piece: <LiveSegmentedControl {...props} /> },
    { caption: 'Desactivado', piece: <LiveSegmentedControl {...props} disabled /> },
    { caption: 'Ocupado', piece: <LiveSegmentedControl {...props} busyValue={props.value} /> },
  ];
}

const TRAY_SPECIMENS: Specimen[] = [
  ...stateSpecimens(SERVICE),
  { caption: '2.º elegido', piece: <LiveSegmentedControl {...SERVICE} value="bus" /> },
  { caption: 'labelVisible', piece: <LiveSegmentedControl {...SERVICE} labelVisible /> },
];

const PILL_SPECIMENS: Specimen[] = [
  ...stateSpecimens(MODE),
  {
    caption: 'emphasis="solid"',
    piece: <LiveSegmentedControl {...SERVICE} variant="pill" emphasis="solid" />,
  },
  {
    caption: 'Opción desactivada',
    piece: (
      <LiveSegmentedControl
        {...DIRECTION}
        options={[
          { value: 'sol', label: 'Hacia Sol' },
          { value: 'chamartin', label: 'Hacia Chamartín', disabled: true },
        ]}
      />
    ),
  },
];

export function SegmentedControlSection() {
  return (
    <ReviewSection title="SegmentedControl">
      <p className="text-meta text-fg-muted">
        Hover, foco y pulsado se prueban con el ratón y el teclado.
      </p>
      <SpecimenRow title='variant="tray"' specimens={TRAY_SPECIMENS} />
      <SpecimenRow title='variant="cards"' specimens={stateSpecimens(NEED)} />
      <SpecimenRow title='variant="pill" · emphasis="soft" y "solid"' specimens={PILL_SPECIMENS} />
      <SpecimenRow
        title='variant="pill" · «Sentido»'
        specimens={[{ caption: 'Normal', piece: <LiveSegmentedControl {...DIRECTION} /> }]}
      />
    </ReviewSection>
  );
}
