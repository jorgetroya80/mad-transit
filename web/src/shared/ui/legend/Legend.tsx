import { LINE_STYLE_CLASSES, type LineStyle, type Tone, toneLineStyle } from '../tone';

type SwatchShape = 'circle' | 'square';
type LegendLayout = 'inline' | 'stacked';

type LegendItem = {
  tone: Tone;
  text: string;
  shape?: SwatchShape;
  // Overrides the tone's line: the map legend draws danger solid, like the map point.
  lineStyle?: LineStyle;
  // 'tag' swaps only the fill for the tag color, as the stop's point does on the map.
  fill?: SwatchFill;
};

type SwatchFill = 'tone' | 'tag';

type LegendProps = {
  label: string;
  items: readonly LegendItem[];
  layout?: LegendLayout;
};

// Danger and muted are a 10 px fill inside a 2 px border, 14 px in all like the others.
const SWATCH_TONE = {
  success: 'bg-tone-success',
  warning: 'bg-tone-warning',
  danger: 'bg-surface border-2 border-tone-danger-line',
  neutral: 'bg-tone-neutral',
  muted: 'bg-tone-muted border-2 border-tone-muted-line',
  info: 'bg-tone-info',
  inverse: 'bg-tone-inverse',
} as const satisfies Record<Tone, string>;

const SWATCH_SHAPE = {
  circle: 'rounded-full',
  square: 'rounded',
} as const satisfies Record<SwatchShape, string>;

const LEGEND_LAYOUT = {
  inline: 'flex-row flex-wrap',
  stacked: 'flex-col',
} as const satisfies Record<LegendLayout, string>;

function Swatch({
  tone,
  shape = 'circle',
  lineStyle = toneLineStyle[tone],
  fill = 'tone',
}: LegendItem) {
  const color = fill === 'tag' ? 'bg-tag' : SWATCH_TONE[tone];
  return (
    <span
      aria-hidden="true"
      className={`size-3.5 shrink-0 box-border ${SWATCH_SHAPE[shape]} ${color} ${LINE_STYLE_CLASSES[lineStyle]}`}
    />
  );
}

// The text carries the whole meaning («5 o más», not «verde»); the swatch is decoration.
export function Legend({ label, items, layout = 'inline' }: LegendProps) {
  return (
    <ul
      aria-label={label}
      className={`flex gap-x-3.5 gap-y-2.5 text-meta text-tone-neutral-soft-foreground ${LEGEND_LAYOUT[layout]}`}
    >
      {items.map((item) => (
        <li key={item.text} className="flex items-center gap-1.5">
          <Swatch {...item} />
          {item.text}
        </li>
      ))}
    </ul>
  );
}
