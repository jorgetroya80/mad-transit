import { BannerSection } from './BannerSection';
import { ButtonSection } from './ButtonSection';
import { CountBadgeSection } from './CountBadgeSection';
import { EmptyStateSection } from './EmptyStateSection';
import { IconButtonSection } from './IconButtonSection';
import { IconSection } from './IconSection';
import { LegendSection } from './LegendSection';
import { SearchFieldSection } from './SearchFieldSection';
import { SegmentedControlSection } from './SegmentedControlSection';
import { StatTileSection } from './StatTileSection';
import { StatusTextSection } from './StatusTextSection';
import { TagSection } from './TagSection';
import { ToneSection } from './ToneSection';

// Development only (app/router.tsx): the library next to the design board, until the
// screens use it.
export function DevComponentsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 bg-canvas p-6">
      <h1 className="text-title-lg text-fg">Librería de componentes</h1>
      <ToneSection />
      <IconSection />
      <IconButtonSection />
      <ButtonSection />
      <SegmentedControlSection />
      <SearchFieldSection />
      <BannerSection />
      <EmptyStateSection />
      <StatusTextSection />
      <CountBadgeSection />
      <TagSection />
      <StatTileSection />
      <LegendSection />
    </main>
  );
}
