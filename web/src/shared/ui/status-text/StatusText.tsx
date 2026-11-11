type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';
type StatusSize = 'md' | 'sm';

type StatusTextProps = {
  text: string;
  tone: StatusTone;
  showDot?: boolean;
  size?: StatusSize;
  // Only for a change of meaning: a text that ticks every second must stay off.
  live?: 'off' | 'polite';
};

// The warning dot is 2.75:1 on white: it is decorative and the text says the same.
const TONE_CLASSES = {
  success: { dot: 'bg-tone-success', text: 'text-fg-muted font-normal' },
  warning: { dot: 'bg-tone-warning-dot', text: 'text-tone-warning-label font-semibold' },
  danger: { dot: 'bg-tone-danger-line', text: 'text-tone-danger-label font-semibold' },
  neutral: { dot: 'bg-handle', text: 'text-fg-muted font-semibold' },
} as const satisfies Record<StatusTone, { dot: string; text: string }>;

const SIZE_CLASSES = {
  md: 'text-body',
  sm: 'text-caption',
} as const satisfies Record<StatusSize, string>;

// polite is an <output>, since oxlint's prefer-tag-over-role rejects role="status".
export function StatusText({
  text,
  tone,
  showDot = true,
  size = 'md',
  live = 'off',
}: StatusTextProps) {
  const Root = live === 'polite' ? 'output' : 'span';
  const { dot, text: textClasses } = TONE_CLASSES[tone];
  return (
    <Root className={`inline-flex items-center gap-1.5 ${SIZE_CLASSES[size]} ${textClasses}`}>
      {showDot ? (
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dot}`} />
      ) : null}
      {text}
    </Root>
  );
}
