import {
  type AnyRootRoute,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  type RouteComponent,
  type RouterHistory,
  stringifySearchWith,
  stripSearchParams,
} from '@tanstack/react-router';
import { MapPage, validateMapSearch } from '@/pages/map';

// The component is injectable so tests can render a feature inside the real `/` route.
function createRouteTree(mapComponent: RouteComponent) {
  const rootRoute = createRootRoute();
  const mapRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: mapComponent,
    validateSearch: validateMapSearch,
    search: { middlewares: [stripSearchParams({ need: 'bikes' })] },
  });
  return rootRoute.addChildren(
    import.meta.env.DEV ? [mapRoute, createDevComponentsRoute(rootRoute)] : [mapRoute],
  );
}

// Behind import.meta.env.DEV and a dynamic import, so the production build drops the page.
function createDevComponentsRoute<TRootRoute extends AnyRootRoute>(rootRoute: TRootRoute) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/dev/components',
    component: lazyRouteComponent(() => import('@/pages/dev-components'), 'DevComponentsPage'),
  });
}

type AppRouterOptions = { history?: RouterHistory; mapComponent?: RouteComponent };

// Plain-text search: the default JSON parser reads ?station=538 as a number and writes '538' as %22538%22.
export function createAppRouter({ history, mapComponent = MapPage }: AppRouterOptions = {}) {
  return createRouter({
    routeTree: createRouteTree(mapComponent),
    history,
    parseSearch: (search) => Object.fromEntries(new URLSearchParams(search)),
    stringifySearch: stringifySearchWith(String, (value) => value),
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
