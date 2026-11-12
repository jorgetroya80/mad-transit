import { render } from '@testing-library/react';
import { Icon, type IconName } from '@/shared/ui';

// The first stroke of a library icon, drawn apart, tells which icon an element shows.
export function iconPath(name: IconName) {
  const { container, unmount } = render(<Icon name={name} />);
  const path = container.querySelector('path')?.getAttribute('d');
  unmount();
  return path;
}

export function firstIconPath(element: Element | null | undefined) {
  return element?.querySelector('svg path')?.getAttribute('d');
}
