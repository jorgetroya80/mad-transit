import { ControlGroup, IconButton } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

function ignorePress() {}

function Zoom({ isZoomInDisabled = false }: { isZoomInDisabled?: boolean }) {
  return (
    <ControlGroup label="Zoom del mapa">
      <IconButton label="Acercar" icon="plus" disabled={isZoomInDisabled} onClick={ignorePress} />
      <IconButton label="Alejar" icon="minus" onClick={ignorePress} />
    </ControlGroup>
  );
}

// The library has no chevron-right, so the specimen mirrors the left one.
function Days() {
  return (
    <span className="[&_button:last-child_svg]:-scale-x-100">
      <ControlGroup label="Cambiar de día" orientation="horizontal">
        <IconButton label="Día anterior" icon="chevron-left" onClick={ignorePress} />
        <IconButton label="Día siguiente" icon="chevron-left" onClick={ignorePress} />
      </ControlGroup>
    </span>
  );
}

// A lone button is no group: it floats on its own.
function ZoomAndLocate() {
  return (
    <span className="flex items-start gap-3">
      <Zoom />
      <IconButton
        label="Centrar en mi posición"
        icon="locate"
        variant="floating"
        size="lg"
        iconTone="primary"
        onClick={ignorePress}
      />
    </span>
  );
}

const SPECIMENS: Specimen[] = [
  { caption: 'Normal · vertical', piece: <Zoom /> },
  { caption: 'Desactivado (zoom máximo)', piece: <Zoom isZoomInDisabled /> },
  { caption: 'horizontal (otro dominio)', piece: <Days /> },
  { caption: 'Junto a centrar', piece: <ZoomAndLocate /> },
];

export function ControlGroupSection() {
  return (
    <ReviewSection title="ControlGroup">
      <SpecimenRow title="Estados (dentro de la caja)" specimens={SPECIMENS} />
    </ReviewSection>
  );
}
