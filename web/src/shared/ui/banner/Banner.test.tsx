import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { ICON_DRAWINGS } from '../icons';
import { Banner } from '.';

type BannerProps = ComponentProps<typeof Banner>;
type BannerAction = NonNullable<BannerProps['action']>;

const NO_LOCATION = {
  tone: 'info',
  icon: 'pin',
  message: 'Mostrando estaciones cerca de la Puerta del Sol.',
} as const;

const QUOTA = {
  tone: 'warning',
  icon: 'clock',
  title: 'Llegadas no disponibles por ahora.',
  message: 'Los horarios de abajo siguen siendo válidos.',
} as const;

const OFFLINE = {
  tone: 'inverse',
  icon: 'wifi-off',
  title: 'Sin conexión a internet.',
  message: 'Se actualizará solo al volver a conectarte.',
} as const;

function locationAction(overrides: Partial<BannerAction> = {}): BannerAction {
  return { label: 'Usar mi ubicación', onClick: () => {}, ...overrides };
}

function renderBanner(props: Partial<BannerProps> = {}) {
  const { container } = render(<Banner {...NO_LOCATION} {...props} />);
  return { banner: container.firstElementChild as HTMLElement, container };
}

function actionButton() {
  return screen.getByRole('button', { name: 'Usar mi ubicación' });
}

describe('Banner', () => {
  it('requires a message, and a label when it has an action', () => {
    expectTypeOf<Pick<BannerProps, 'message' | 'tone'>>().toEqualTypeOf<{
      message: string;
      tone: 'info' | 'warning' | 'danger' | 'inverse';
    }>();
    expectTypeOf<Pick<BannerAction, 'label'>>().toEqualTypeOf<{ label: string }>();
  });

  it.each([
    ['stations', NO_LOCATION.message],
    ['stops', QUOTA.message],
  ])('shows a message about %s', (_domain, message) => {
    renderBanner({ message });

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('leads with the bold title in the same run of text', () => {
    renderBanner(QUOTA);
    const title = screen.getByText(QUOTA.title);

    expect(title.tagName).toBe('STRONG');
    expect(title.parentElement).toHaveTextContent(`${QUOTA.title} ${QUOTA.message}`);
  });

  it('has no title unless one is given', () => {
    expect(renderBanner().banner.querySelector('strong')).toBeNull();
  });

  it.each([
    ['info', ['bg-tone-info-soft', 'border', 'border-tone-info-soft-line'], 'text-fg'],
    [
      'warning',
      ['bg-tone-warning-soft', 'border', 'border-tone-warning-soft-line'],
      'text-tone-warning-soft-foreground',
    ],
    ['danger', ['bg-tone-danger-soft'], 'text-tone-danger-soft-foreground'],
    ['inverse', ['bg-tone-inverse'], 'text-tone-inverse-foreground'],
  ] as const)('draws %s with its fill, border and text', (tone, surface, text) => {
    const { banner } = renderBanner({ tone });

    expect(banner).toHaveClass(...surface);
    expect(screen.getByText(NO_LOCATION.message)).toHaveClass(text);
  });

  it.each(['danger', 'inverse'] as const)('draws %s without a border', (tone) => {
    expect(renderBanner({ tone }).banner).not.toHaveClass('border');
  });

  it.each([
    ['info', 'text-tone-info-icon'],
    ['warning', 'text-tone-warning-icon'],
    ['danger', 'text-tone-danger-icon'],
    ['inverse', 'text-tone-inverse-icon'],
  ] as const)('colors the %s icon', (tone, iconClass) => {
    const svg = renderBanner({ tone }).banner.querySelector('svg');

    expect(svg).toHaveClass(iconClass);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg?.querySelector('path')).toHaveAttribute('d', ICON_DRAWINGS.pin.paths[0]);
  });

  it('has no icon unless one is given', () => {
    const { banner } = renderBanner({ icon: undefined });

    expect(banner.querySelector('svg')).toBeNull();
  });

  it('is a card by default, with its radius and padding', () => {
    expect(renderBanner().banner).toHaveClass('rounded-card', 'px-3.5', 'py-3');
  });

  it('is a full width bar, square and centered, as layout="bar"', () => {
    const { banner } = renderBanner({ ...OFFLINE, layout: 'bar' });

    expect(banner).toHaveClass('w-full', 'rounded-none', 'justify-center', 'px-6', 'py-3');
    expect(banner).not.toHaveClass('rounded-card');
  });

  it('lets the action wrap under the text when it does not fit', () => {
    expect(renderBanner({ action: locationAction() }).banner).toHaveClass('flex', 'flex-wrap');
  });

  describe('action', () => {
    it('is a small button named by its label', async () => {
      const onClick = vi.fn<() => void>();
      renderBanner({ action: locationAction({ onClick }) });

      await userEvent.click(actionButton());

      expect(actionButton()).toHaveClass('h-10');
      expect(onClick).toHaveBeenCalledOnce();
    });

    it.each([
      ['info', ['bg-primary', 'text-primary-foreground']],
      ['warning', ['bg-surface', 'border-tone-warning-icon', 'text-tone-warning-soft-foreground']],
      ['danger', ['bg-surface', 'border-primary', 'text-primary']],
      ['inverse', ['bg-surface', 'border-primary', 'text-primary']],
    ] as const)('takes the %s look', (tone, classes) => {
      renderBanner({ tone, action: locationAction() });

      expect(actionButton()).toHaveClass(...classes);
    });

    it('stays focusable while busy', () => {
      renderBanner({ action: locationAction({ busy: true }) });
      const button = actionButton();

      button.focus();

      expect(button).toHaveFocus();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('can be disabled', () => {
      renderBanner({ action: locationAction({ disabled: true }) });

      expect(actionButton()).toBeDisabled();
    });
  });

  describe('focus ring', () => {
    it('turns white on inverse, for any button inside', () => {
      const { banner } = renderBanner({ ...OFFLINE, action: locationAction() });

      expect(banner).toHaveClass('[--focus-ring-color:var(--color-tone-inverse-foreground)]');
      expect(actionButton()).toHaveClass('focus-ring');
    });

    it.each(['info', 'warning', 'danger'] as const)('keeps the primary ring on %s', (tone) => {
      expect(renderBanner({ tone }).banner.className).not.toContain('--focus-ring-color');
    });
  });

  describe('announce', () => {
    it('is no live region by default', () => {
      const { banner } = renderBanner(QUOTA);

      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(banner.querySelector('output, [aria-live]')).toBeNull();
    });

    it('is an <output> holding only the title and the message when polite', () => {
      renderBanner({ ...QUOTA, announce: 'polite', action: locationAction() });
      const region = screen.getByRole('status');

      expect(region.tagName).toBe('OUTPUT');
      expect(region).toHaveTextContent(`${QUOTA.title} ${QUOTA.message}`);
      expect(region).not.toContainElement(actionButton());
    });

    it('is an alert holding only the title and the message when assertive', () => {
      renderBanner({ ...OFFLINE, announce: 'assertive', action: locationAction() });
      const region = screen.getByRole('alert');

      expect(region.tagName).toBe('DIV');
      expect(region).toHaveTextContent(`${OFFLINE.title} ${OFFLINE.message}`);
      expect(region).not.toContainElement(actionButton());
      expect(region.querySelector('svg')).toBeNull();
    });
  });

  it.each([
    ['info with action', { action: locationAction() }],
    ['warning with title', QUOTA],
    ['danger', { tone: 'danger', icon: 'cloud-alert' }],
    ['inverse bar', { ...OFFLINE, layout: 'bar' }],
    ['polite', { announce: 'polite' }],
    ['assertive', { ...OFFLINE, announce: 'assertive' }],
    ['busy action', { action: locationAction({ busy: true }) }],
    ['disabled action', { action: locationAction({ disabled: true }) }],
  ] as const)('passes axe as %s', async (_name, props) => {
    const { container } = renderBanner(props);

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
