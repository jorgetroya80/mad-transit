import { ICON_NAMES, ICON_SIZES, Icon, type IconName } from '@/shared/ui';
import { ReviewSection } from './ReviewSection';

function IconSizes({ name }: { name: IconName }) {
  return (
    <li
      aria-label={name}
      className="flex flex-col gap-2 rounded-control border border-line-subtle bg-surface p-3"
    >
      <code className="text-meta text-fg">{name}</code>
      <div className="flex items-end gap-4 text-fg">
        {ICON_SIZES.map((size) => (
          <Icon key={size} name={name} size={size} />
        ))}
      </div>
    </li>
  );
}

export function IconSection() {
  return (
    <ReviewSection title="Iconos">
      <p className="text-meta text-fg-muted">Cada nombre a {ICON_SIZES.join(', ')} px.</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-2">
        {ICON_NAMES.map((name) => (
          <IconSizes key={name} name={name} />
        ))}
      </ul>
    </ReviewSection>
  );
}
