import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApproximateLocationBanner, LocatingBanner } from '.';

const TEXTS = {
  current: 'Ubicación actual en uso.',
  denied: 'Permiso denegado: mostrando un punto de referencia.',
  missing: 'Sin ubicación: mostrando un punto de referencia.',
};

const ACTION = { label: 'Activar', pendingLabel: 'Buscando…' };

describe('ApproximateLocationBanner', () => {
  it('renders nothing when the location is not approximate', () => {
    const { container } = render(
      <ApproximateLocationBanner
        isApproximateLocation={false}
        isLocationDenied={false}
        missingText={TEXTS.missing}
        deniedText={TEXTS.denied}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the missing text when the location is approximate', () => {
    render(
      <ApproximateLocationBanner
        isApproximateLocation
        isLocationDenied={false}
        missingText={TEXTS.missing}
        deniedText={TEXTS.denied}
      />,
    );

    expect(screen.getByText(TEXTS.missing)).toBeInTheDocument();
    expect(screen.queryByText(TEXTS.denied)).not.toBeInTheDocument();
  });

  it('shows the denied text when the permission was denied', () => {
    render(
      <ApproximateLocationBanner
        isApproximateLocation
        isLocationDenied
        missingText={TEXTS.missing}
        deniedText={TEXTS.denied}
      />,
    );

    expect(screen.getByText(TEXTS.denied)).toBeInTheDocument();
  });
});

describe('LocatingBanner', () => {
  it('shows the current text without an action when the location is not approximate', () => {
    render(
      <LocatingBanner
        isApproximateLocation={false}
        isLocationDenied={false}
        texts={TEXTS}
        action={{ ...ACTION, onLocate: vi.fn<() => void>(), isLocating: false }}
      />,
    );

    expect(screen.getByText(TEXTS.current)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the denied text without an action when the permission was denied', () => {
    render(
      <LocatingBanner
        isApproximateLocation
        isLocationDenied
        texts={TEXTS}
        action={{ ...ACTION, onLocate: vi.fn<() => void>(), isLocating: false }}
      />,
    );

    expect(screen.getByText(TEXTS.denied)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers the action when the location is missing, and calls it on click', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn<() => void>();
    render(
      <LocatingBanner
        isApproximateLocation
        isLocationDenied={false}
        texts={TEXTS}
        action={{ ...ACTION, onLocate, isLocating: false }}
      />,
    );

    expect(screen.getByText(TEXTS.missing)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Activar' }));
    expect(onLocate).toHaveBeenCalledOnce();
  });

  it('shows the pending label and is busy while locating', () => {
    render(
      <LocatingBanner
        isApproximateLocation
        isLocationDenied={false}
        texts={TEXTS}
        action={{ ...ACTION, onLocate: vi.fn<() => void>(), isLocating: true }}
      />,
    );

    const button = screen.getByRole('button', { name: 'Buscando…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
