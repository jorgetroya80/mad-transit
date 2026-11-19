# Plan: web-crash-screen

- Created: 2026-11-19
- Status: **approved** (2026-11-19)
- Spec: [SPEC-web-crash-screen.md](../specs/SPEC-web-crash-screen.md)

## Overview

Activar el React Compiler y dar a los errores de render la pantalla «Algo ha fallado» con «Recargar», tanto dentro del router (`defaultErrorComponent`) como por encima de él (`AppErrorBoundary`). Son cuatro tareas en una rama y un PR `feat(web)`. El compiler va primero porque es lo más arriesgado: si rompe algo, sale antes de escribir la pantalla.

## Decisiones de implementación

- **Una rama, `feat/web-crash-screen`, desde `main`**, con un commit por tarea y sin `Co-Authored-By`. La spec, este plan y el capability map entran en el commit de T1.
- **El compiler, sin tocar tests ni memorizaciones** (supuestos 14 a 16): si un test falla con el compiler, se para y se pregunta. No se cambia el test.
- **El foco al título lo pone `CrashScreen`**, no `EmptyState`: un `useEffect` busca el `h1` dentro de su `<main>` y lo enfoca. Así la librería solo gana `headingLevel={1}` (supuesto 5) y no una prop de foco.
- **Los tests que lanzan errores a propósito silencian `console.error`** con un `vi.spyOn(console, 'error').mockImplementation(() => {})` y comprueban que se llamó (SC5), para que la salida de la suite siga limpia.
- **Sin más dependencias** que las cuatro del supuesto 13.

## Grafo de dependencias

```
T1 React Compiler (vite.config.ts, devDependencies)
        │
        ▼
T2 EmptyState h1 + CrashScreen ─┬─► T3 defaultErrorComponent en el router
                                └─► T4 AppErrorBoundary en App.tsx
                                            │
                                            ▼
                                    Checkpoint final (manual, docs)
```

T3 y T4 dependen solo de T2 y no se tocan entre sí, pero van en serie porque comparten rama.

## Task List

- [x] **T1: activar el React Compiler** (S, ~45 min)
  - Descripción: instalar en `web` las cuatro `devDependencies` del supuesto 13 con su versión exacta (`pnpm --filter web add -D babel-plugin-react-compiler@1.0.0 @rolldown/plugin-babel@0.2.4 @babel/core@7.29.13 @types/babel__core@7.20.5`) y añadir `babel({ presets: [reactCompilerPreset()] })` a los plugins de `vite.config.ts`, tras `react()`. La spec, el plan y el capability map entran en este commit.
  - Aceptación:
    - `pnpm --filter web build` pasa y `dist/assets/*.js` contiene el código del compiler (`react.memo_cache_sentinel` o la importación de `react/compiler-runtime`).
    - Toda la suite de la web pasa sin cambiar ningún test (SC6).
    - `vite.config.ts` pasa `tsc` con los tipos de Babel.
  - Verificación: `pnpm --filter web build && grep -l "memo_cache_sentinel" dist/assets/*.js`; `pnpm --filter web test`; `pnpm check:task`, apuntando su duración en el changelog.
  - Archivos: `web/vite.config.ts`, `web/package.json`, `pnpm-lock.yaml`, spec, plan, capability map.
  - Dependencias: ninguna.

- [x] **T2: `EmptyState` con `h1` y `CrashScreen`** (M, ~1 h)
  - Descripción: `EmptyState` acepta `headingLevel` 1 (`h1`). `CrashScreen` en `app/crash-screen/` (supuestos 4 a 10): `<main>` a pantalla completa sobre `bg-surface` con `EmptyState` `danger`, `warning`, `announce="alert"`, `headingLevel={1}`, los textos aprobados y «Recargar» (`refresh`), que llama a `window.location.reload()`. Al montarse enfoca el `h1`.
  - Aceptación:
    - `EmptyState` con `headingLevel={1}` pinta un `h1`, y los niveles 2 y 3 siguen igual.
    - `CrashScreen` tiene `h1` «Algo ha fallado», el texto aprobado y `role="alert"`, el foco en el `h1` y «Recargar» llama a `window.location.reload` (espiado con `vi.spyOn` sobre `location`, o con `vi.stubGlobal`).
    - axe sin infracciones.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/empty-state src/app/crash-screen`; `pnpm check:task`.
  - Archivos: `shared/ui/empty-state/EmptyState{,.test}.tsx`, `app/crash-screen/{CrashScreen,CrashScreen.test}.tsx`, `app/crash-screen/index.ts`.
  - Dependencias: T1.

- [x] **T3: `CrashScreen` como `defaultErrorComponent` del router** (S, ~30 min)
  - Descripción: test primero en `router.test.tsx`. Con `renderWithRouter` y un componente que lanza al renderizar, debe salir «Algo ha fallado» y no «Something went wrong!». Después se añade `defaultErrorComponent: CrashScreen` a `createRouter` (supuesto 1).
  - Aceptación:
    - Un error de render en `/` muestra `CrashScreen` (SC1).
    - Un `?station=` válido sigue funcionando y los tests de URL de hoy pasan sin cambios.
    - El error llega a `console.error` (SC5).
  - Verificación: `pnpm --filter web exec vitest run src/app`; `pnpm check:task`.
  - Archivos: `app/router.tsx`, `app/router.test.tsx`.
  - Dependencias: T2.

- [x] **T4: `AppErrorBoundary` por encima del router** (S, ~45 min)
  - Descripción: test primero. Un hijo que lanza al renderizar muestra `CrashScreen`, y sin error se pintan los hijos. Después se crea `AppErrorBoundary` en `app/crash-screen/`, un componente de clase con `getDerivedStateFromError` y sin `componentDidCatch` (supuesto 3), y en `App.tsx` se envuelve a `QueryProvider` y `RouterProvider` con él.
  - Aceptación:
    - Un error en un proveedor muestra `CrashScreen` y no una página en blanco (SC2).
    - Sin error, `App` pinta lo de hoy: los tests de `pages/map` y `router` pasan sin cambios.
    - Un error dentro de una ruta lo sigue pintando el router, no `AppErrorBoundary`. El test de T3 lo cubre, porque `renderWithRouter` no monta `AppErrorBoundary`.
  - Verificación: `pnpm --filter web exec vitest run src/app`; `pnpm check:task`.
  - Archivos: `app/crash-screen/{AppErrorBoundary,AppErrorBoundary.test}.tsx`, `app/crash-screen/index.ts`, `app/App.tsx`.
  - Dependencias: T2.

### Checkpoint final

- [ ] Prueba manual en `pnpm --filter web dev:mock`, a 1440 px y a 390 px, contra «Escritorio · fallo inesperado» y «Error · fallo inesperado»: un `throw` temporal en `MapPage` y otro en `QueryProvider`, sin commitearlos. En los dos sale la pantalla, el foco está en el título, VoiceOver la anuncia una vez y «Recargar» vuelve a la misma URL (SC1 a SC4).
- [ ] React DevTools marca los componentes como compilados («Memo ✨»).
- [ ] `pnpm check:task` en verde; resultado real en el changelog.
- [ ] Permiso del usuario para push, PR y merge. Tras el merge, la spec, el plan y el capability map pasan a `implemented` en un PR `docs`.

## Riesgos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Un componente que rompe las reglas de React cambia de comportamiento con el compiler | Alto | T1 va primero con la suite entera; si un test falla, se para y se pregunta (decisiones). |
| `@rolldown/plugin-babel` o Babel no funcionan en Vitest 5 o con la cobertura v8 | Medio | T1 corre `test:coverage` dentro de `check:task`; si falla, se pregunta antes de cambiar de versión. |
| Babel alarga `check:task` más allá de 90 s | Bajo | Se mide en T1 y se apunta en el changelog. |
| `location.reload` no se puede espiar en jsdom | Bajo | `vi.stubGlobal('location', …)` con un `reload` falso; `unstubGlobals` ya está activo. |

## Open Questions

Ninguna.

## Changelog

- 2026-11-19: plan creado y aprobado.
- 2026-11-19: T1 hecha. Instalados `babel-plugin-react-compiler` 1.0.0, `@rolldown/plugin-babel` 0.2.4, `@babel/core` 7.29.13 y `@types/babel__core` 7.20.5. `pnpm --filter web build` pasa y `memo_cache_sentinel` aparece en `index-*.js` y `map-point-*.js`. La suite pasa sin cambiar tests (2466 en verde, 1 `skip` que ya existía). `pnpm check:task` en verde en 27 s. Con las opciones por defecto el compiler no muestra diagnósticos, así que no se sabe si salta algún componente.
- 2026-11-19: T2 hecha. `EmptyState` acepta `headingLevel={1}` con un mapa de etiquetas en lugar del ternario. `CrashScreen` en `app/crash-screen/` enfoca su `h1` al montarse buscándolo dentro de su `<main>`; «Recargar» se prueba con `vi.stubGlobal('location', …)`. oxlint pide `vi.fn<() => void>()` y una aserción explícita en el test de axe (`resolves.toBeUndefined()`, como en `EmptyState`). `pnpm check:task` en verde; 100 % de las 11 líneas cambiadas cubiertas.
- 2026-11-19: T3 hecha. `defaultErrorComponent: CrashScreen` en `createRouter` (supuesto 1). Dos tests en `router.test.tsx` con un `Broken` que lanza, montado como `ui` de `renderWithRouter`: sale el `h1` «Algo ha fallado» y no «Something went wrong!» (en rojo antes del cambio, porque salía el `ErrorComponent` en inglés), y alguna llamada a `console.error` recibe la misma instancia del `Error` (SC5; ya pasaba antes, queda como guarda). `console.error` se espía en silencio. El caso de `validateSearch` que lanza no se hizo: `createAppRouter` fija `validateMapSearch` y no se puede inyectar sin cambiar su API. Los tests de URL pasan sin cambios. `pnpm check:task` en verde (2477 tests, 1 `skip` que ya existía); 100 % de las 11 líneas cambiadas cubiertas.
- 2026-11-19: T4 hecha. `AppErrorBoundary` en `app/crash-screen/`, componente de clase con solo `getDerivedStateFromError` (supuesto 3), exportado desde `index.ts`; en `App.tsx` envuelve a `QueryProvider` y `RouterProvider`. Tres tests en `AppErrorBoundary.test.tsx` con un `Broken` que lanza: sale el `h1` «Algo ha fallado», sin error se pintan los hijos tal cual, y alguna llamada a `console.error` recibe la misma instancia del `Error` (SC5; la registra el `onCaughtError` por defecto de React 19, también en jsdom). En rojo primero porque `AppErrorBoundary` no existía. `console.error` se espía en silencio con un `silenceConsoleError` local, copiado de `router.test.tsx`. Ningún test cubre `App.tsx`: v8 no le marca sentencias, así que no cuenta en la cobertura de líneas cambiadas; el cableado se prueba en el checkpoint manual. `pnpm check:task` en verde en 23 s (2483 tests, 1 `skip` que ya existía); 100 % de las 11 líneas cambiadas cubiertas.
