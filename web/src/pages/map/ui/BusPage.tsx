import { ServiceToggle } from '@/features/select-service';

// Bus has no map or list yet: the service choice and an empty panel.
export function BusPage() {
  return (
    <main className="flex h-dvh flex-col gap-4 overflow-y-auto p-4">
      <h1 className="sr-only">Mad Transit</h1>
      <ServiceToggle />
      <section aria-label="Paradas">
        <h2 className="text-lg font-semibold text-fg">Paradas</h2>
      </section>
    </main>
  );
}
