import { act } from '@testing-library/react';
import { renderWithRouter } from '../../test/renderWithRouter';

// These tests are about the URL, not the page: a stub keeps the map out of jsdom.
const routeContent = <p>map route</p>;

type AppRouter = Awaited<ReturnType<typeof renderWithRouter>>['router'];

function currentSearch(router: AppRouter) {
  return router.state.matches.at(-1)?.search;
}

function currentUrl(router: AppRouter): URL {
  return new URL(router.state.location.href, 'http://localhost');
}

describe('app router', () => {
  it('reads ?station=538 as a string', async () => {
    const { router } = await renderWithRouter(routeContent, {
      initialEntries: ['/?station=538&need=docks'],
    });

    expect(currentSearch(router)).toEqual({ station: '538', need: 'docks' });
  });

  it('treats an unknown need as bikes', async () => {
    const { router } = await renderWithRouter(routeContent, { initialEntries: ['/?need=xyz'] });

    expect(currentSearch(router)).toEqual({ need: 'bikes' });
  });

  it('reads ?service=bus&stop=72 as a bus stop', async () => {
    const { router } = await renderWithRouter(routeContent, {
      initialEntries: ['/?service=bus&stop=72'],
    });

    expect(currentSearch(router)).toEqual({ need: 'bikes', service: 'bus', stop: '72' });
  });

  it('reads an unknown service and a stop without service=bus as BiciMAD, dropping the stop', async () => {
    const { router } = await renderWithRouter(routeContent, {
      initialEntries: ['/?service=xyz&stop=72'],
    });

    expect(currentSearch(router)).toEqual({ need: 'bikes' });
  });

  it('writes the station as plain text and leaves out need=bikes', async () => {
    const { router } = await renderWithRouter(routeContent);

    await act(() => router.navigate({ to: '/', search: { station: '538', need: 'bikes' } }));

    expect(router.state.location.href).toBe('/?station=538');
  });

  it('writes service=bus with its stop and leaves out service=bicimad', async () => {
    const { router } = await renderWithRouter(routeContent);

    await act(() =>
      router.navigate({ to: '/', search: { service: 'bus', stop: '72', need: 'bikes' } }),
    );
    expect(router.state.location.href).toBe('/?service=bus&stop=72');

    await act(() => router.navigate({ to: '/', search: { service: 'bicimad', need: 'bikes' } }));
    expect(router.state.location.href).toBe('/');
  });

  it('writes need=docks next to the station', async () => {
    const { router } = await renderWithRouter(routeContent);

    await act(() => router.navigate({ to: '/', search: { station: '538', need: 'docks' } }));

    const url = currentUrl(router);
    expect(url.pathname).toBe('/');
    expect(Object.fromEntries(url.searchParams)).toEqual({ station: '538', need: 'docks' });
  });
});

describe('component review page', () => {
  it('is gone, even in development', async () => {
    expect(import.meta.env.DEV).toBe(true);

    const { router } = await renderWithRouter(routeContent, {
      initialEntries: ['/dev/components'],
    });

    expect(router.state.matches.map((match) => match.routeId)).not.toContain('/dev/components');
  });
});
