import { TONES, type Tone } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';

// Only the suffixes each tone has in index.css; the others fall back to the solid.
const TONE_SUFFIXES = {
  success: ['', '-foreground', '-soft', '-soft-foreground', '-line', '-icon', '-label'],
  warning: [
    '',
    '-foreground',
    '-soft',
    '-soft-foreground',
    '-line',
    '-soft-line',
    '-icon',
    '-label',
    '-dot',
  ],
  danger: ['', '-foreground', '-soft', '-soft-foreground', '-line', '-icon', '-label'],
  neutral: ['', '-foreground', '-soft', '-soft-foreground', '-icon', '-label'],
  muted: ['', '-foreground', '-line', '-icon', '-label'],
  info: ['', '-foreground', '-soft', '-soft-foreground', '-line', '-soft-line', '-icon', '-label'],
  inverse: ['', '-foreground', '-icon'],
} as const satisfies Record<Tone, readonly string[]>;

const OTHER_TOKENS = ['surface-disabled', 'line-subtle', 'tag', 'tag-inverse', 'tag-ring'];

function Swatch({ token }: { token: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-8 shrink-0 rounded-chip border border-line"
        style={{ backgroundColor: `var(--color-${token})` }}
      />
      <code className="text-meta text-fg">{token}</code>
    </li>
  );
}

function SwatchList({ label, tokens }: { label: string; tokens: readonly string[] }) {
  return (
    <ul aria-label={label} className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-2">
      {tokens.map((token) => (
        <Swatch key={token} token={token} />
      ))}
    </ul>
  );
}

export function ToneSection() {
  return (
    <ReviewSection title="Tonos">
      {TONES.map((tone) => (
        <SwatchList
          key={tone}
          label={tone}
          tokens={TONE_SUFFIXES[tone].map((suffix) => `tone-${tone}${suffix}`)}
        />
      ))}
      <SwatchList label="Otros" tokens={OTHER_TOKENS} />
    </ReviewSection>
  );
}
