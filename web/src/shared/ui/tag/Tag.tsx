type TagVariant = 'default' | 'inverse';
type TagSize = 'sm' | 'md';

type TagProps = {
  label: string;
  variant?: TagVariant;
  ring?: boolean;
  size?: TagSize;
  srText?: string;
};

const TAG_FILL = {
  default: 'bg-tag',
  inverse: 'bg-tag-inverse',
} as const satisfies Record<TagVariant, string>;

const TAG_SIZE = {
  sm: 'h-5 min-w-8',
  md: 'h-6 min-w-9.5',
} as const satisfies Record<TagSize, string>;

const TAG_BASE =
  'inline-flex shrink-0 items-center justify-center box-border rounded-tag px-1.25 text-caption font-bold text-tone-inverse-foreground';

const TAG_RING = 'inset-ring-2 inset-ring-tag-ring';

// The variant alone must not tell lines apart: whoever uses it adds srText or a visible word.
export function Tag({ label, variant = 'default', ring = false, size = 'sm', srText }: TagProps) {
  return (
    <span className={`${TAG_BASE} ${TAG_SIZE[size]} ${TAG_FILL[variant]} ${ring ? TAG_RING : ''}`}>
      <span aria-hidden={srText ? true : undefined}>{label}</span>
      {srText ? <span className="sr-only">{srText}</span> : null}
    </span>
  );
}
