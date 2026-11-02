import { render } from '@testing-library/react';
import {
  BikeIcon,
  ChevronIcon,
  ClearIcon,
  DockIcon,
  InfoIcon,
  LocationIcon,
  MinusIcon,
  OfflineIcon,
  PlusIcon,
  RefreshIcon,
  StarIcon,
  WarningIcon,
} from '.';

const DECORATIVE_ICONS = [
  BikeIcon,
  DockIcon,
  ClearIcon,
  WarningIcon,
  OfflineIcon,
  InfoIcon,
  LocationIcon,
  StarIcon,
  ChevronIcon,
  PlusIcon,
  MinusIcon,
  RefreshIcon,
];

describe('icons', () => {
  it.each(DECORATIVE_ICONS)(
    '%o is hidden from assistive technology and drawn with a 2 px stroke',
    (Icon) => {
      const { container } = render(<Icon className="size-5" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('stroke-width', '2');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveClass('size-5');
    },
  );
});
