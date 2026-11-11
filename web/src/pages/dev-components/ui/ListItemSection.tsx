import { type ComponentProps, type ReactNode, useState } from 'react';
import { CountBadge, IconButton, ListItem, Tag } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type ListItemProps = ComponentProps<typeof ListItem>;

function ignoreSelect() {}

const STATION = {
  leadingText: '33',
  title: 'Puerta del Sol',
  subtitle: '57 m · 1 min a pie',
  accessibleLabel: 'Estación 33, Puerta del Sol, 57 metros, 3 bicis',
  onSelect: ignoreSelect,
} as const satisfies ListItemProps;

const STATION_BADGE = <CountBadge value="3" tone="warning" />;
const STATION_SM_BADGE = <CountBadge value="3" tone="warning" size="sm" />;
const FEW = { text: 'Pocas', tone: 'warning' } as const;

const STOP_LINES = (
  <span className="flex gap-1">
    <span className="sr-only">Líneas:</span>
    <Tag label="5" />
    <Tag label="15" />
    <Tag label="20" />
  </span>
);

const STOP = {
  leadingText: '1211',
  title: 'Alcalá-Sevilla',
  below: STOP_LINES,
  trailing: <span className="text-meta text-fg-muted">140 m</span>,
  accessibleLabel: 'Parada 1211, Alcalá-Sevilla, 140 metros, líneas 5, 15 y 20',
  onSelect: ignoreSelect,
} as const satisfies ListItemProps;

// The rows sit in a list, as the screens will put them; the caller renders the <li>.
function RowFrame({ children }: { children: ReactNode }) {
  return <div className="w-82.5">{children}</div>;
}

// Static, so the button of its own does not sit inside another button. It toggles like the
// real one, to be tried with the mouse and the keyboard.
function ArrivalRow({ isShownInitially }: { isShownInitially: boolean }) {
  const [isShown, setShown] = useState(isShownInitially);
  const trailing = (
    <span className="flex items-center gap-2">
      <span className="text-label font-bold text-fg">2 min</span>
      <IconButton
        label="Ver en el mapa el autobús de la línea 51"
        icon="pin"
        variant="outline"
        iconTone="primary"
        iconSize={18}
        pressed={isShown}
        onClick={() => setShown(!isShown)}
      />
    </span>
  );
  return <ListItem leading={<Tag label="51" size="md" />} title="ATOCHA" trailing={trailing} />;
}

function framed(caption: string, piece: ReactNode): Specimen {
  return { caption, piece: <RowFrame>{piece}</RowFrame> };
}

const MD_SPECIMENS: Specimen[] = [
  framed('Normal', <ListItem {...STATION} trailing={STATION_BADGE} />),
  framed(
    'Seleccionada (aria-current)',
    <ListItem {...STATION} trailing={STATION_BADGE} selected />,
  ),
  framed('Desactivada', <ListItem {...STATION} trailing={STATION_BADGE} disabled />),
  framed(
    'Ocupada',
    <ListItem {...STATION} trailing={STATION_BADGE} busy busyLabel="Cargando disponibilidad" />,
  ),
];

const SM_SPECIMENS: Specimen[] = [
  framed(
    'sm · con pie del final',
    <ListItem {...STATION} density="sm" trailing={STATION_SM_BADGE} trailingCaption={FEW} />,
  ),
  framed(
    'sm · seleccionada',
    <ListItem
      {...STATION}
      density="sm"
      trailing={STATION_SM_BADGE}
      trailingCaption={FEW}
      selected
    />,
  ),
  framed('Parada (below = Tag)', <ListItem {...STOP} />),
  framed('Estática con IconButton (llegada)', <ArrivalRow isShownInitially={false} />),
  framed('Estática · botón alternado', <ArrivalRow isShownInitially />),
];

export function ListItemSection() {
  return (
    <ReviewSection title="ListItem">
      <SpecimenRow title='Pulsable · density="md" (escritorio)' specimens={MD_SPECIMENS} />
      <SpecimenRow title='density="sm" (móvil) y otros dominios' specimens={SM_SPECIMENS} />
    </ReviewSection>
  );
}
