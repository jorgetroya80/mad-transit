import { Tag } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';
import { type Specimen, SpecimenRow } from './SpecimenRow';

const NIGHT_LINE = {
  label: 'N16',
  variant: 'inverse',
  ring: true,
  srText: 'línea nocturna N16',
} as const;

const SPECIMENS: Specimen[] = [
  { caption: 'default · sm', piece: <Tag label="51" /> },
  { caption: 'default · md', piece: <Tag label="51" size="md" /> },
  { caption: 'inverse + ring · sm', piece: <Tag {...NIGHT_LINE} /> },
  { caption: 'inverse + ring · md', piece: <Tag {...NIGHT_LINE} size="md" /> },
  {
    caption: 'En una fila',
    piece: (
      <span className="flex gap-1">
        <span className="sr-only">Líneas:</span>
        <Tag label="3" />
        <Tag label="51" />
        <Tag label="53" />
      </span>
    ),
  },
];

export function TagSection() {
  return (
    <ReviewSection title="Tag">
      <SpecimenRow title="Variantes y tamaños" specimens={SPECIMENS} />
    </ReviewSection>
  );
}
