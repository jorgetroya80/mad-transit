import { useEffect, useRef } from 'react';
import { EmptyState } from '@/shared/ui';

const MESSAGE =
  'La aplicación ha tenido un error inesperado. Recarga la página para seguir; tus favoritas se mantienen.';

// A full reload clears whatever state broke the render, and a chunk left behind by a deploy.
function reload() {
  window.location.reload();
}

// Replaces the whole page: the header or the map may be what failed.
export function CrashScreen() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.querySelector('h1')?.focus();
  }, []);

  return (
    <main ref={mainRef} className="grid min-h-dvh place-items-center bg-surface">
      <EmptyState
        tone="danger"
        icon="warning"
        title="Algo ha fallado"
        message={MESSAGE}
        action={{ label: 'Recargar', icon: 'refresh', onClick: reload }}
        announce="alert"
        headingLevel={1}
      />
    </main>
  );
}
