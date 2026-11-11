import { type ComponentProps, type ReactNode, useId, useState } from 'react';
import { Banner, Card, IconButton, ListItem, StatTile, StatusText, Tag } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type CardProps = ComponentProps<typeof Card>;
type HeaderProps = ComponentProps<typeof Card.Header>;

type SpecimenCardProps = Omit<HeaderProps, 'titleId'> & {
  elevation?: CardProps['elevation'];
  as?: CardProps['as'];
  body: ReactNode;
  separated?: boolean;
  updated: string;
};

function ignorePress() {}

function closeButton(label: string) {
  return <IconButton label={label} icon="close" onClick={ignorePress} />;
}

const CLOSE_STATION = closeButton('Cerrar la ficha de la estación');

const BACK = <IconButton label="Volver a la lista" icon="chevron-left" onClick={ignorePress} />;

// Toggles like the real star, to be tried with the mouse and the keyboard.
function FavoriteStar() {
  const [isFavorite, setFavorite] = useState(false);
  return (
    <IconButton
      label="Favorita"
      icon="star"
      pressedIcon="star-filled"
      iconTone="primary"
      pressed={isFavorite}
      tooltip={isFavorite ? 'Quitar de favoritas' : 'Añadir a favoritas'}
      onClick={() => setFavorite(!isFavorite)}
    />
  );
}

const TILES = (
  <div className="grid grid-cols-2 gap-2">
    <StatTile value="3" label="bicis disponibles" tone="warning" />
    <StatTile value="21" label="anclajes libres" tone="success" />
  </div>
);

type Arrival = { line: string; destination: string; time: string; isArriving?: boolean };

const ARRIVALS: readonly Arrival[] = [
  { line: '3', destination: 'SAN AMARO', time: 'Llegando', isArriving: true },
  { line: '51', destination: 'ATOCHA', time: '2 min' },
  { line: '53', destination: 'PLAZA DE ESPAÑA', time: '7 min' },
];

function ArrivalTime({ time, isArriving = false }: Pick<Arrival, 'time' | 'isArriving'>) {
  const color = isArriving ? 'text-tone-success-label' : 'text-fg';
  return <span className={`text-label font-bold ${color}`}>{time}</span>;
}

const ARRIVAL_LIST = (
  <ul>
    {ARRIVALS.map(({ line, destination, time, isArriving }) => (
      <li key={line}>
        <ListItem
          density="sm"
          leading={<Tag label={line} />}
          title={destination}
          trailing={<ArrivalTime time={time} isArriving={isArriving} />}
        />
      </li>
    ))}
  </ul>
);

const RETRY_BANNER = (
  <Banner
    tone="danger"
    icon="warning"
    message="No se pudo cargar la estación."
    action={{ label: 'Reintentar', onClick: ignorePress }}
  />
);

// Escape is wired to nothing here: the screens decide what it closes.
function SpecimenCard(props: SpecimenCardProps) {
  const { elevation, as, body, separated, updated, ...header } = props;
  const titleId = useId();
  return (
    <Card titleId={titleId} elevation={elevation} as={as} onEscape={ignorePress}>
      <Card.Header titleId={titleId} titleLevel={3} {...header} />
      <Card.Body separated={separated}>{body}</Card.Body>
      <Card.Footer>
        <StatusText text={updated} tone="success" size="sm" showDot={false} />
      </Card.Footer>
    </Card>
  );
}

function BusyCard() {
  const titleId = useId();
  return (
    <Card titleId={titleId} onEscape={ignorePress}>
      <Card.Header
        titleId={titleId}
        titleLevel={3}
        meta="Estación 12 · 120 m"
        title="Plaza Mayor"
        cornerActions={CLOSE_STATION}
        titleAction={<FavoriteStar />}
      />
      <Card.Body busy busyLabel="Cargando la disponibilidad">
        {TILES}
      </Card.Body>
      <Card.Footer>
        <StatusText text="Actualizado hace 30 s" tone="success" size="sm" showDot={false} />
      </Card.Footer>
    </Card>
  );
}

function floating(caption: string, piece: ReactNode): Specimen {
  return { caption, piece: <div className="w-80 max-w-[calc(100vw-3rem)]">{piece}</div> };
}

// The board outlines the flat card to show where the panel's padding ends.
function inPanel(caption: string, piece: ReactNode): Specimen {
  return {
    caption,
    piece: (
      <div className="w-89.5 max-w-[calc(100vw-3rem)] border border-dashed border-line bg-surface py-3">
        {piece}
      </div>
    ),
  };
}

// Each card is named by its title, so titles differ wherever axe would find two regions of the
// same name (landmark-unique); the stop card is an article for the same reason.
const FLOAT_SPECIMENS: Specimen[] = [
  floating(
    'Estación',
    <SpecimenCard
      meta="Estación 33 · 57 m"
      title="Puerta del Sol"
      cornerActions={CLOSE_STATION}
      titleAction={<FavoriteStar />}
      body={TILES}
      updated="Actualizado hace 30 s"
    />,
  ),
  floating(
    'Parada con llegadas · as="article"',
    <SpecimenCard
      as="article"
      meta="Parada 48 · a 45 m"
      title="Puerta del Sol"
      cornerActions={closeButton('Cerrar la ficha de la parada')}
      body={ARRIVAL_LIST}
      separated
      updated="Actualizado hace 10 s"
    />,
  ),
  floating('Ocupada (Card.Body busy)', <BusyCard />),
  floating(
    'Error (Banner danger en el cuerpo)',
    <SpecimenCard
      meta="Estación 4 · 310 m"
      title="Callao"
      cornerActions={CLOSE_STATION}
      titleAction={<FavoriteStar />}
      body={RETRY_BANNER}
      updated="Actualizado hace 30 s"
    />,
  ),
];

const FLAT_SPECIMENS: Specimen[] = [
  inPanel(
    'Estación · flat, con volver',
    <SpecimenCard
      elevation="flat"
      leadingAction={BACK}
      meta="Estación 58 · 200 m"
      title="Ópera"
      titleAction={<FavoriteStar />}
      body={TILES}
      updated="Actualizado hace 30 s"
    />,
  ),
];

export function CardSection() {
  return (
    <ReviewSection title="Card">
      <SpecimenRow title='elevation="float" (escritorio)' specimens={FLOAT_SPECIMENS} />
      <SpecimenRow
        title='elevation="flat" (detalle en el panel móvil)'
        specimens={FLAT_SPECIMENS}
      />
    </ReviewSection>
  );
}
