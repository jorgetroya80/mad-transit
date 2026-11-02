import type { ReactNode } from 'react';
import { BottomSheet } from '@/shared/ui';

type AppLayoutProps = {
  title: string;
  map: ReactNode;
  panel: ReactNode;
  panelLabel: string;
  panelExpanded?: boolean;
  onPanelExpandedChange?: (expanded: boolean) => void;
};

// Full-screen map plus a bottom sheet below md (its handle strip takes the last row of the
// column, so the map ends above it). From md up the page composes its own desktop layout.
export function AppLayout({
  title,
  map,
  panel,
  panelLabel,
  panelExpanded,
  onPanelExpandedChange,
}: AppLayoutProps) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <h1 className="sr-only">{title}</h1>
      <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
      <BottomSheet
        label={panelLabel}
        expanded={panelExpanded}
        onExpandedChange={onPanelExpandedChange}
      >
        {panel}
      </BottomSheet>
    </main>
  );
}
