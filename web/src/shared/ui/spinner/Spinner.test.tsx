import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Spinner } from '.';

function renderSpinner(props: ComponentProps<typeof Spinner>) {
  const { container } = render(<Spinner {...props} />);
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('Spinner rendered no svg');
  return svg;
}

describe('Spinner', () => {
  it('is decorative: the piece that shows it names the wait', () => {
    expect(renderSpinner({})).toHaveAttribute('aria-hidden', 'true');
  });

  it('is 20 px by default', () => {
    const svg = renderSpinner({});

    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('can take another icon size', () => {
    expect(renderSpinner({ size: 18 })).toHaveAttribute('width', '18');
  });

  it('turns once a second and stands still with reduced motion', () => {
    expect(renderSpinner({})).toHaveClass('animate-spin', 'motion-reduce:animate-none');
  });

  it('draws an incomplete ring in the current color over a light track', () => {
    const svg = renderSpinner({});

    expect(svg.querySelector('circle')).toHaveClass('stroke-line');
    expect(svg.querySelector('path')).toHaveAttribute('stroke', 'currentColor');
  });

  it('adds the classes it receives', () => {
    expect(renderSpinner({ className: 'text-primary' })).toHaveClass('text-primary');
  });
});
