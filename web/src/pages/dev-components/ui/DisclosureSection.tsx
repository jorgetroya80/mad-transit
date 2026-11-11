import { type ReactNode, useState } from 'react';
import { Disclosure } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

const PANEL = <p className="px-2 pb-2 text-meta text-fg-muted">Contenido del panel</p>;

// Each one is a named region, and axe wants every region named apart: hence the counts.
const FAVORITES = { title: 'Favoritas', icon: 'star', headingLevel: 4 } as const;

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="w-75 rounded-card border border-line-subtle bg-surface p-1">{children}</div>
  );
}

// Kept open or closed from outside, as a screen does when the state must last.
function ControlledFavorites() {
  const [isOpen, setOpen] = useState(true);
  return (
    <Disclosure {...FAVORITES} count="1" open={isOpen} onOpenChange={setOpen}>
      <p className="px-2 pb-2 text-meta text-fg-muted">{`Abierta desde fuera: ${isOpen ? 'sí' : 'no'}`}</p>
    </Disclosure>
  );
}

const MD_SPECIMENS: Specimen[] = [
  {
    caption: 'Desplegado',
    piece: (
      <Frame>
        <Disclosure {...FAVORITES} count="2">
          {PANEL}
        </Disclosure>
      </Frame>
    ),
  },
  {
    caption: 'Plegado',
    piece: (
      <Frame>
        <Disclosure {...FAVORITES} count="3" defaultOpen={false}>
          {PANEL}
        </Disclosure>
      </Frame>
    ),
  },
  {
    caption: 'Controlada (open / onOpenChange)',
    piece: (
      <Frame>
        <ControlledFavorites />
      </Frame>
    ),
  },
  {
    caption: 'Horario · defaultOpen={false}',
    piece: (
      <Frame>
        <Disclosure title="Horario de hoy" icon="clock" headingLevel={4} defaultOpen={false}>
          {PANEL}
        </Disclosure>
      </Frame>
    ),
  },
];

const SM_SPECIMENS: Specimen[] = [
  {
    caption: 'Desplegado · sm',
    piece: (
      <Frame>
        <Disclosure {...FAVORITES} count="4" size="sm">
          {PANEL}
        </Disclosure>
      </Frame>
    ),
  },
  {
    caption: 'Plegado · sm',
    piece: (
      <Frame>
        <Disclosure {...FAVORITES} count="5" size="sm" defaultOpen={false}>
          {PANEL}
        </Disclosure>
      </Frame>
    ),
  },
];

export function DisclosureSection() {
  return (
    <ReviewSection title="Disclosure">
      <SpecimenRow title='size="md" (escritorio)' specimens={MD_SPECIMENS} />
      <SpecimenRow title='size="sm" (móvil)' specimens={SM_SPECIMENS} />
    </ReviewSection>
  );
}
