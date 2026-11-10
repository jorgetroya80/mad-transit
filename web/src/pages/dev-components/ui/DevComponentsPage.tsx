import { ButtonSection } from './ButtonSection';
import { IconButtonSection } from './IconButtonSection';
import { IconSection } from './IconSection';
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
    </main>
  );
}
