import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { stationsFixture } from '@/shared/api/mocks/fixtures';
import { server } from '@/shared/api/mocks/node';
import { env } from '@/shared/config';
import { expectNoAxeViolations } from '../../../../test/axe';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { AppHeader } from './AppHeader';

const STATIONS_URL = `${env.apiBaseUrl}/v1/bicimad/stations`;
// The fixtures' data is 5 min old here, still confirmed.
const NOW = new Date('2026-10-13T10:20:00Z');

// Answers the first request at once and holds the next ones until `release`.
function holdRefetch() {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  server.use(
    http.get(STATIONS_URL, async () => {
      requests += 1;
      if (requests > 1) await released;
      return HttpResponse.json(stationsFixture);
    }),
  );
  return { release };
}

describe('AppHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it('shows the brand as the page heading with its subtitle', async () => {
    await renderWithRouter(<AppHeader />);

    expect(screen.getByRole('heading', { level: 1, name: 'Mad Transit' })).toBeVisible();
    expect(screen.getByText('BiciMAD en tiempo real')).toBeInTheDocument();
  });

  it('tells how fresh the stations are', async () => {
    await renderWithRouter(<AppHeader />);

    expect(await screen.findByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent('Actualizado hace 5 minutos');
  });

  it('stays busy while it asks for the stations again', async () => {
    const { release } = holdRefetch();
    await renderWithRouter(<AppHeader />);
    const button = await screen.findByRole('button', { name: 'Actualizar' });

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');

    await act(async () => release());
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('has no axe violations', async () => {
    const { container } = await renderWithRouter(<AppHeader />);
    await screen.findByRole('button', { name: 'Actualizar' });

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
