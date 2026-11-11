import { BannerSection } from './BannerSection';
import { ButtonSection } from './ButtonSection';
import { CardSection } from './CardSection';
import { ControlGroupSection } from './ControlGroupSection';
import { CountBadgeSection } from './CountBadgeSection';
import { DisclosureSection } from './DisclosureSection';
import { EmptyStateSection } from './EmptyStateSection';
import { IconButtonSection } from './IconButtonSection';
import { IconSection } from './IconSection';
import { LegendSection } from './LegendSection';
import { ListItemSection } from './ListItemSection';
import { MapPointSection } from './MapPointSection';
import { SearchFieldSection } from './SearchFieldSection';
import { SegmentedControlSection } from './SegmentedControlSection';
import { StatTileSection } from './StatTileSection';
import { StatusTextSection } from './StatusTextSection';
import { TagSection } from './TagSection';
import { ToneSection } from './ToneSection';

// In page order. Exported so the axe test checks one section at a time: the whole page in one
// run is too slow for a CI runner.
export const PAGE_SECTIONS = [
  ToneSection,
  IconSection,
  IconButtonSection,
  ButtonSection,
  SegmentedControlSection,
  SearchFieldSection,
  BannerSection,
  EmptyStateSection,
  StatusTextSection,
  CountBadgeSection,
  TagSection,
  StatTileSection,
  LegendSection,
  ListItemSection,
  DisclosureSection,
  CardSection,
  ControlGroupSection,
  MapPointSection,
] as const;

// Development only (app/router.tsx): the library next to the design board, until the
// screens use it.
export function DevComponentsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 bg-canvas p-6">
      <h1 className="text-title-lg text-fg">Librería de componentes</h1>
      {PAGE_SECTIONS.map((Section) => (
        <Section key={Section.name} />
      ))}
    </main>
  );
}
