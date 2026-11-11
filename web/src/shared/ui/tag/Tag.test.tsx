import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { Tag } from '.';

type TagProps = ComponentProps<typeof Tag>;

function renderTag(props: Partial<TagProps> = {}) {
  const { container } = render(<Tag label="51" {...props} />);
  return { tag: container.firstElementChild as HTMLElement, container };
}

describe('Tag', () => {
  it('requires its label', () => {
    expectTypeOf<Pick<TagProps, 'label'>>().toEqualTypeOf<{ label: string }>();
  });

  it.each(['51', 'N16', 'L1'])('shows «%s»', (label) => {
    renderTag({ label });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('is a white bold label in a tag box', () => {
    expect(renderTag().tag).toHaveClass(
      'rounded-tag',
      'box-border',
      'px-1.25',
      'text-caption',
      'font-bold',
      'text-tone-inverse-foreground',
    );
  });

  it.each([
    ['default', 'bg-tag'],
    ['inverse', 'bg-tag-inverse'],
  ] as const)('fills the %s variant with %s', (variant, fill) => {
    expect(renderTag({ variant }).tag).toHaveClass(fill);
  });

  it('is default by default', () => {
    expect(renderTag().tag).toHaveClass('bg-tag');
  });

  it('draws a 2 px inner ring only when asked', () => {
    expect(renderTag({ ring: true }).tag).toHaveClass('inset-ring-2', 'inset-ring-tag-ring');
  });

  it('has no ring by default', () => {
    expect(renderTag().tag).not.toHaveClass('inset-ring-2');
  });

  it.each([
    ['sm', ['h-5', 'min-w-8']],
    ['md', ['h-6', 'min-w-9.5']],
  ] as const)('sets the %s size', (size, classes) => {
    expect(renderTag({ size }).tag).toHaveClass(...classes);
  });

  it('is sm by default', () => {
    expect(renderTag().tag).toHaveClass('h-5', 'min-w-8');
  });

  describe('srText', () => {
    it('reads the label when there is none', () => {
      const { tag } = renderTag();

      expect(tag).not.toHaveAttribute('aria-hidden');
      expect(tag).toHaveTextContent('51');
      expect(tag.querySelector('[aria-hidden]')).toBeNull();
    });

    it.each([
      ['a night line', 'N16', 'línea nocturna N16'],
      ['a cycle lane', 'C2', 'carril bici C2'],
    ])('replaces the label for %s', (_domain, label, srText) => {
      renderTag({ label, srText, variant: 'inverse', ring: true });

      expect(screen.getByText(label)).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByText(srText)).toHaveClass('sr-only');
    });
  });

  it('is no live region', () => {
    const { container } = renderTag({ srText: 'línea nocturna N16' });

    expect(container.querySelector('output, [role], [aria-live]')).toBeNull();
  });

  it.each([
    ['default sm', {}],
    ['default md', { size: 'md' }],
    [
      'inverse with ring and srText',
      { label: 'N16', variant: 'inverse', ring: true, srText: 'línea nocturna N16' },
    ],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = renderTag(props);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
