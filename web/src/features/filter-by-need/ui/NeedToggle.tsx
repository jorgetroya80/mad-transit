import { type ComponentType, useId } from 'react';
import type { Need } from '@/entities/station';
import { BikeIcon, DockIcon } from '@/shared/ui';
import { useNeed } from '../model/useNeed';

type NeedToggleVariant = 'cards' | 'pill';

type NeedToggleProps = { variant: NeedToggleVariant };

const OPTIONS = [
  { need: 'bikes', title: 'Sacar bici', subtitle: 'Bicis disponibles', Icon: BikeIcon },
  { need: 'docks', title: 'Dejar bici', subtitle: 'Anclajes libres', Icon: DockIcon },
] as const satisfies readonly {
  need: Need;
  title: string;
  subtitle: string;
  Icon: ComponentType<{ className?: string }>;
}[];

type NeedOption = (typeof OPTIONS)[number];

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const VARIANTS = {
  cards: {
    group: 'grid w-full grid-cols-2 gap-2',
    button: `flex min-h-11 flex-col items-start gap-1 rounded-card border border-line-strong bg-surface p-3 text-left text-fg hover:bg-chip aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground ${FOCUS_RING}`,
  },
  pill: {
    group: 'inline-flex rounded-control border border-line-strong bg-surface p-0.5',
    button: `min-h-11 min-w-11 rounded-control px-4 font-medium text-fg-muted hover:bg-chip aria-pressed:bg-primary aria-pressed:text-primary-foreground ${FOCUS_RING}`,
  },
} as const satisfies Record<NeedToggleVariant, { group: string; button: string }>;

// The subtitle describes the card instead of joining its name, so both variants share one name.
function CardContent({ option, subtitleId }: { option: NeedOption; subtitleId: string }) {
  return (
    <>
      <option.Icon className="size-6" />
      <span className="font-semibold">{option.title}</span>
      <span id={subtitleId} aria-hidden="true" className="text-sm">
        {option.subtitle}
      </span>
    </>
  );
}

export function NeedToggle({ variant }: NeedToggleProps) {
  const [need, setNeed] = useNeed();
  const idPrefix = useId();
  const isCards = variant === 'cards';

  return (
    <fieldset className={VARIANTS[variant].group}>
      <legend className="sr-only">¿Qué quieres hacer?</legend>
      {OPTIONS.map((option) => {
        const subtitleId = `${idPrefix}-${option.need}`;
        return (
          <button
            key={option.need}
            type="button"
            aria-pressed={option.need === need}
            aria-describedby={isCards ? subtitleId : undefined}
            onClick={() => setNeed(option.need)}
            className={VARIANTS[variant].button}
          >
            {isCards ? <CardContent option={option} subtitleId={subtitleId} /> : option.title}
          </button>
        );
      })}
    </fieldset>
  );
}
