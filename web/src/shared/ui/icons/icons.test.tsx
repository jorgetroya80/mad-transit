import { render } from '@testing-library/react';
import { ChevronIcon } from '.';

const DECORATIVE_ICONS = [ChevronIcon];

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
