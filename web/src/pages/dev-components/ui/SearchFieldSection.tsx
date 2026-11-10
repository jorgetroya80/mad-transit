import { type ComponentProps, useState } from 'react';
import { SearchField } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

type SearchFieldProps = ComponentProps<typeof SearchField>;
type SpecimenProps = Omit<SearchFieldProps, 'onChange'>;

const STATIONS: SpecimenProps = {
  label: 'Buscar estación',
  placeholder: 'Número o nombre (p. ej. 33 o Sol)',
  hint: 'Busca por número de estación, calle o plaza.',
  clearLabel: 'Borrar búsqueda',
  value: '',
};

const STOPS: SpecimenProps = {
  label: 'Buscar parada por número',
  placeholder: 'Número de parada (p. ej. 72)',
  inputMode: 'numeric',
  clearLabel: 'Borrar búsqueda',
  value: '',
};

const OFFLINE_PLACEHOLDER = 'Disponible al volver a conectarte';

// Each specimen keeps its own text, so typing, clearing and Escape can be tried.
function LiveSearchField(props: SpecimenProps) {
  const [value, setValue] = useState(props.value);
  return (
    <div className="w-75">
      <SearchField {...props} value={value} onChange={setValue} />
    </div>
  );
}

const BOX_SPECIMENS: Specimen[] = [
  { caption: 'Normal', piece: <LiveSearchField {...STATIONS} /> },
  { caption: 'Con texto + borrar', piece: <LiveSearchField {...STATIONS} value="Sol" /> },
  {
    caption: 'Desactivado',
    piece: <LiveSearchField {...STATIONS} placeholder={OFFLINE_PLACEHOLDER} disabled />,
  },
  { caption: 'Ocupado', piece: <LiveSearchField {...STATIONS} value="Sol" busy /> },
];

const STOP_SPECIMENS: Specimen[] = [
  { caption: 'inputMode="numeric"', piece: <LiveSearchField {...STOPS} /> },
  {
    caption: 'Error',
    piece: (
      <LiveSearchField
        {...STOPS}
        value="12345"
        error="El número de parada tiene de 1 a 4 cifras."
      />
    ),
  },
];

const PILL: SpecimenProps = { ...STATIONS, shape: 'pill', labelVisible: false, hint: undefined };

const PILL_SPECIMENS: Specimen[] = [
  { caption: 'Normal', piece: <LiveSearchField {...PILL} /> },
  { caption: 'Con texto + borrar', piece: <LiveSearchField {...PILL} value="Sol" /> },
  {
    caption: 'Desactivado',
    piece: <LiveSearchField {...PILL} placeholder={OFFLINE_PLACEHOLDER} disabled />,
  },
];

export function SearchFieldSection() {
  return (
    <ReviewSection title="SearchField">
      <p className="text-meta text-fg-muted">
        Hover y foco se prueban con el ratón y el teclado; Escape borra el texto.
      </p>
      <SpecimenRow title='shape="box" · estaciones' specimens={BOX_SPECIMENS} />
      <SpecimenRow title='shape="box" · paradas' specimens={STOP_SPECIMENS} />
      <SpecimenRow title='shape="pill" · etiqueta oculta' specimens={PILL_SPECIMENS} />
    </ReviewSection>
  );
}
