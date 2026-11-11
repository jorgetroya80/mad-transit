import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { IconButton } from '../icon-button';
import { ControlGroup } from '.';

type ControlGroupProps = ComponentProps<typeof ControlGroup>;

function ignorePress() {}

function renderZoom(props: Partial<ControlGroupProps> & { isZoomInDisabled?: boolean } = {}) {
  const { isZoomInDisabled = false, ...groupProps } = props;
  const { container } = render(
    <ControlGroup label="Zoom del mapa" {...groupProps}>
      <IconButton label="Acercar" icon="plus" disabled={isZoomInDisabled} onClick={ignorePress} />
      <IconButton label="Alejar" icon="minus" onClick={ignorePress} />
    </ControlGroup>,
  );
  return { group: screen.getByRole('group', { name: 'Zoom del mapa' }), container };
}

function renderDays() {
  const { container } = render(
    <ControlGroup label="Cambiar de día" orientation="horizontal">
      <IconButton label="Día anterior" icon="chevron-left" onClick={ignorePress} />
      <IconButton label="Día siguiente" icon="chevron-left" onClick={ignorePress} />
    </ControlGroup>,
  );
  return { group: screen.getByRole('group', { name: 'Cambiar de día' }), container };
}

describe('ControlGroup', () => {
  it('requires a label', () => {
    expectTypeOf<Pick<ControlGroupProps, 'label'>>().toEqualTypeOf<{ label: string }>();
  });

  it('groups its buttons in a fieldset named by the label', () => {
    const { group } = renderZoom();

    expect(group.tagName).toBe('FIELDSET');
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeInTheDocument();
  });

  it('serves other screens: the days of a timetable, side by side', () => {
    const { group } = renderDays();

    expect(group).toContainElement(screen.getByRole('button', { name: 'Día anterior' }));
    expect(group).toContainElement(screen.getByRole('button', { name: 'Día siguiente' }));
  });

  it('draws one floating box with hidden overflow', () => {
    const { group } = renderZoom();

    expect(group).toHaveClass('bg-surface', 'shadow-control', 'rounded-control', 'overflow-hidden');
  });

  it('stacks the buttons with no gap and a subtle line between them by default', () => {
    const { group } = renderZoom();

    expect(group).toHaveClass('flex-col', 'divide-y', 'divide-line-subtle');
    expect(group).not.toHaveClass('gap-1');
  });

  it('lays them side by side when horizontal', () => {
    const { group } = renderDays();

    expect(group).toHaveClass('flex-row', 'divide-x', 'divide-line-subtle');
  });

  it('keeps hover, press and the focus ring inside each button', () => {
    const { group } = renderZoom();

    expect(group).toHaveClass('*:rounded-none', '[--focus-ring-offset:-2px]');
  });

  it('tabs through each button', async () => {
    renderZoom();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Acercar' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Alejar' })).toHaveFocus();
  });

  it('skips a disabled button, as at the highest zoom', async () => {
    renderZoom({ isZoomInDisabled: true });

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Acercar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Alejar' })).toHaveFocus();
  });

  it.each([
    ['vertical', () => renderZoom()],
    ['vertical with a disabled button', () => renderZoom({ isZoomInDisabled: true })],
    ['horizontal', renderDays],
  ])('passes axe: %s', async (_name, renderGroup) => {
    const { container } = renderGroup();

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
