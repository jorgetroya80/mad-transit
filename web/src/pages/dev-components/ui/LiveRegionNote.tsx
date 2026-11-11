type LiveRegionNoteProps = { live: string; quiet: string };

// A page full of live regions would talk over itself, so each notice has one live specimen.
export function LiveRegionNote({ live, quiet }: LiveRegionNoteProps) {
  return (
    <p className="text-meta text-fg-muted">
      {`Solo un ejemplo es región viva (${live}); el resto va con ${quiet} para que el lector de pantalla no los lea todos a la vez.`}
    </p>
  );
}
