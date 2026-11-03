import type { ReactNode } from 'react';
import { BottomSheet, type SheetSnap } from '@/shared/ui';

type AppLayoutProps = {
  title: string;
  map: ReactNode;
  panel: ReactNode;
  panelLabel: string;
  panelSnap: SheetSnap;
  onPanelSnapChange: (snap: SheetSnap) => void;
  panelNextSnap: Record<SheetSnap, SheetSnap>;
  panelHandleLabel: string;
};

// Full-screen map plus a bottom sheet below md (its peek strip takes the last row of the
// column, so the map ends above it). From md up the page composes its own desktop layout.
export function AppLayout({
  title,
  map,
  panel,
  panelLabel,
  panelSnap,
  onPanelSnapChange,
  panelNextSnap,
  panelHandleLabel,
}: AppLayoutProps) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <h1 className="sr-only">{title}</h1>
      <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
      <BottomSheet
        label={panelLabel}
        snap={panelSnap}
        onSnapChange={onPanelSnapChange}
        nextSnap={panelNextSnap}
        handleLabel={panelHandleLabel}
      >
        {panel}
      </BottomSheet>
    </main>
  );
}
