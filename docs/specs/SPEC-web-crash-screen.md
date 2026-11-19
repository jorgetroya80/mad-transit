# Spec: web-crash-screen

- Created: 2026-11-19
- Status: **implemented** (2026-11-19)
- Plan: [PLAN-web-crash-screen.md](../plans/PLAN-web-crash-screen.md)

Módulo `web-crash-screen` del [Capability Map](CAPABILITY-MAP.md). Da una pantalla propia, en español y con los tokens del rediseño, a los errores de render: un bug en un componente, no un fallo de datos (esos los cubre [web-error-states](SPEC-web-error-states.md)). Aplica los tableros «Escritorio · fallo inesperado» (1440 px) y «Error · fallo inesperado» (390 px) del lienzo «Mad Transit · rediseño», que es privado. Los dos están al final de sus filas de errores.

Incluye además activar el React Compiler en la web (decisión del usuario, 2026-11-19); ver «React Compiler».

## Objective

Que un bug en la interfaz no deje al usuario delante de una pantalla rota sin salida, falle donde falle el render: dentro del router o por encima de él.

Hoy, si un componente lanza al renderizar, TanStack Router pinta su `ErrorComponent` por defecto: «Something went wrong!» en inglés, sin estilos y con un botón «Show Error» que enseña el mensaje técnico. Si el error ocurre fuera del router, la página queda en blanco.

- Como usuario, si la app falla, veo «Algo ha fallado», entiendo que no es culpa mía y tengo un botón «Recargar» que me devuelve a la app.
- Como usuario, al recargar sigo en la misma estación o parada, porque la URL se conserva, y mis favoritas siguen ahí.
- Como usuario de lector de pantalla, el aviso se anuncia una vez y el foco va al título.
- Como desarrollador, el error sigue saliendo en la consola con su traza.

**Fuera de alcance:** los fallos de datos (`error`, `stale`, `offline`), ya resueltos en `web-error-states`; la ruta no encontrada (`notFoundComponent`): la app solo tiene `/`, y la URL desconocida ya se trata en `validateMapSearch`; enviar errores a un servicio externo (telemetría), que necesitaría una dependencia; abrir la app sin conexión (`web-offline-shell`).

## Decisiones (2026-11-19, del diseñador)

1. **Tableros nuevos.** No había nada para este caso: «ErrorApi» y «DeskErrorApi» cubren el API caído, no un fallo de la app, y la Especificación de UI no tenía este estado. Los dos tableros nuevos ocupan toda la pantalla, sin cabecera ni mapa, y usan `EmptyState` y `Button` de la librería.
2. **Accesibilidad.** El bloque es `role="alert"`, el título es de nivel 1 porque es lo único que hay en la página, y el foco va al título al aparecer.
3. **Textos aprobados tal cual.** «Algo ha fallado» se distingue de «No podemos cargar las estaciones», que es el error del API. La frase «tus favoritas se mantienen» vale solo si las favoritas siguen en `localStorage` después de recargar. Si el fallo obligara a limpiar datos guardados corruptos, se quitaría y quedaría «Recarga la página para seguir.». Comprobado en el código (2026-11-19): `useLocalStorage` valida cada valor al leerlo y, si es inválido, usa el de por defecto sin lanzar. Un dato corrupto no puede tumbar la app, así que no hay que limpiarlo y la frase se queda. La pantalla no toca `localStorage`.

## Assumptions

1. **Dónde se engancha.** Con `defaultErrorComponent` en `createRouter` y no con `errorComponent` en la ruta raíz. Una ruta hija sin `errorComponent` usa el de por defecto del router, no el de la raíz; así cubre `/` y cualquier ruta futura.
2. **Qué cubre el router.** Su `CatchBoundary` captura los errores de render, `validateSearch`, `beforeLoad` y `loader` de las rutas. No captura los de `QueryProvider` ni los del propio `RouterProvider`, que están por encima de él; de esos se encarga el supuesto 3. Ninguno de los dos captura los errores en manejadores de eventos, en callbacks de MapLibre ni en promesas sin `await`, porque React no los captura en ningún límite de error. Esos siguen como hoy.
3. **`AppErrorBoundary` para lo que queda fuera del router** (decisión del usuario, 2026-11-19). Es un límite de error propio de React, un componente de clase con `getDerivedStateFromError`, sin `react-error-boundary` ni ninguna otra dependencia. En `App.tsx` envuelve a `QueryProvider` y `RouterProvider` y, si captura un error, pinta la misma `CrashScreen`. No lleva `componentDidCatch`: React 19 ya escribe en la consola los errores capturados (`onCaughtError` por defecto). No reintenta ni se reinicia: la única salida es «Recargar». Un error dentro de una ruta lo sigue pintando el router, así que `AppErrorBoundary` solo actúa cuando el router no puede.
4. **Pantalla completa, sin cabecera.** La ruta raíz no tiene layout, así que la pantalla sustituye a toda la página. Lleva su propio `<main>` y el título como `h1`. No monta la cabecera ni el mapa, porque pueden ser la causa del fallo.
5. **Construida con `EmptyState`** de `shared/ui` (decisión 1): `tone="danger"`, `icon="warning"`, `announce="alert"`, `size="md"`, centrada en vertical y horizontal sobre `bg-surface`. `EmptyState` acepta hoy `headingLevel` 2 o 3; se añade el 1 para el título de nivel 1 (decisión 2). Es un cambio pequeño y genérico en la librería, con su test.
6. **Textos** (decisión 3).
   - Título: «Algo ha fallado».
   - Texto: «La aplicación ha tenido un error inesperado. Recarga la página para seguir; tus favoritas se mantienen.»
   - Acción: «Recargar», con el icono `refresh`.
7. **«Recargar» recarga la página entera** (`window.location.reload()`), y no llama a `reset()` ni a `router.invalidate()`. Una recarga limpia el estado que causó el error y también arregla el caso más probable tras un despliegue: un fragmento de JS antiguo que ya no existe. La URL se conserva, así que la estación o la parada abierta sigue en `?station=` o `?stop=`.
8. **Foco.** Al montarse, el foco va al título (`tabIndex={-1}`, ya soportado por `EmptyState`), para que el teclado y el lector empiecen ahí.
9. **Sin detalles técnicos en pantalla**, ni en desarrollo ni en producción. El router (`console.error`) y React 19 (supuesto 3) ya escriben el error en la consola, y esa sigue siendo la vía para depurar.
10. **Dónde vive.** En `app/crash-screen/`, porque la usan el router y `App.tsx`, los dos de la capa `app`. Solo importa de `shared/ui`, así que cumple las reglas de capas de `depcruise`.
11. **La pantalla no añade dependencias.** Las únicas nuevas son las del React Compiler (siguiente sección).

## React Compiler

Decisiones del usuario (2026-11-19): activarlo por Babel y no por la versión en Rust, que el README de `@vitejs/plugin-react` marca como experimental, e incluirlo en este módulo y no en uno aparte.

Hoy no está activado: `vite.config.ts` usa `react()` sin opciones y no hay ningún paquete del compiler instalado.

12. **Cómo se activa.** Con `reactCompilerPreset` de `@vitejs/plugin-react` y `@rolldown/plugin-babel`, como indica el README del plugin: `plugins: [react(), babel({ presets: [reactCompilerPreset()] }), …]`. Usa las opciones por defecto: compila todo (`compilationMode` sin cambiar) y `target` 19, que importa de `react/compiler-runtime` y no necesita `react-compiler-runtime`.
13. **Dependencias nuevas** (`devDependencies`, versiones fijas y con más de 10 días, por `minimumReleaseAge`):
    - `babel-plugin-react-compiler` 1.0.0.
    - `@rolldown/plugin-babel` 0.2.4: el plugin pide `^0.1.7 || ^0.2.0`, así que la 0.3.x no vale.
    - `@babel/core` 7.29.13: el compiler depende de `@babel/types` 7, y la 8.1.2 tiene menos de 10 días.
    - `@types/babel__core` 7.20.5, porque Babel 7 no trae tipos y `vite.config.ts` pasa por `tsc`.
14. **Vitest también compila con él**, porque usa los plugins de `vite.config.ts`. Los tests de hoy prueban así que el comportamiento no cambia.
15. **Los `useMemo`, `useCallback` y `memo` actuales se quedan** (36 usos). Quitarlos es otro cambio, que se decide después de medir.
16. **Un componente que rompe las reglas de React** el compiler lo deja sin optimizar, sin fallar el build. No se arregla en este módulo; si sale alguno, se apunta en el changelog del plan.

## Tech Stack

El de [web-redesign-components](SPEC-web-redesign-components.md#tech-stack): React 19.3.0, `@tanstack/react-router` 1.170.41, Vite 8.3.4 y `@vitejs/plugin-react` 6.1.1. Se añaden las cuatro `devDependencies` del React Compiler del supuesto 13.

## Commands

```bash
pnpm --filter web dev:mock
pnpm --filter web test
pnpm --filter web test:coverage
pnpm --filter web depcruise
pnpm --filter web build
pnpm check:task
```

Prueba manual en `dev:mock`, a 1440 px y a 390 px: hacer que un componente de la página lance un error de forma temporal (sin commitearlo), y luego `QueryProvider`, y comprobar en los dos casos la pantalla, el foco en el título, que VoiceOver la anuncia una vez y que «Recargar» vuelve a la misma URL.

## Project Structure

```
web/src/
  app/crash-screen/CrashScreen.tsx        pantalla: <main>, EmptyState con h1, Recargar
  app/crash-screen/CrashScreen.test.tsx
  app/crash-screen/index.ts
  app/crash-screen/AppErrorBoundary.tsx    límite de error de clase por encima del router
  app/crash-screen/AppErrorBoundary.test.tsx
  app/App.tsx                             AppErrorBoundary envuelve QueryProvider y RouterProvider
  app/router.tsx                          defaultErrorComponent: CrashScreen
  app/router.test.tsx                     una ruta que lanza muestra CrashScreen
  shared/ui/empty-state/EmptyState.tsx    headingLevel acepta 1
web/vite.config.ts                        babel({ presets: [reactCompilerPreset()] })
web/package.json                          devDependencies del compiler
pnpm-lock.yaml
```

## Code Style

El de [web-redesign-components](SPEC-web-redesign-components.md#code-style): textos en español, clases enteras y un test de `expectNoAxeViolations` por pieza.

```tsx
export function CrashScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface">
      <EmptyState
        tone="danger"
        icon="warning"
        title="Algo ha fallado"
        message="La aplicación ha tenido un error inesperado. Recarga la página para seguir; tus favoritas se mantienen."
        action={{ label: 'Recargar', icon: 'refresh', onClick: () => window.location.reload() }}
        announce="alert"
        headingLevel={1}
      />
    </main>
  );
}
```

## Testing Strategy

- Vitest y Testing Library, como hoy.
- `CrashScreen`: `h1` «Algo ha fallado», el texto, `role="alert"`, foco en el título al montarse y «Recargar» que llama a `window.location.reload` (espiado); axe sin infracciones.
- Router: con `renderWithRouter` y un `mapComponent` que lanza al renderizar, sale `CrashScreen` y no «Something went wrong!». Lo mismo con un `validateSearch` que lanza.
- `AppErrorBoundary`: un hijo que lanza al renderizar muestra `CrashScreen`; sin error, pinta sus hijos sin cambios.
- `EmptyState`: con `headingLevel={1}` el título es un `h1`.
- React Compiler: la suite entera pasa sin cambios en los tests, y `pnpm --filter web build` deja en `dist/` el código compilado (las llamadas a `react/compiler-runtime`).
- Cobertura ≥ 80 % por capa; `pnpm --filter web depcruise` sin violaciones.

## Boundaries

- **Siempre:** textos en español; tokens del rediseño, sin hex fuera de `index.css`; dejar el error en la consola.
- **Preguntar antes:** cualquier dependencia distinta de las del supuesto 13 (telemetría y `react-error-boundary` incluidas); textos distintos de los del supuesto 6; cambiar las opciones del compiler.
- **Nunca:** mostrar el mensaje o la traza del error al usuario; usar la pantalla para fallos de datos; montar la cabecera o el mapa dentro de ella; quitar `useMemo`, `useCallback` o `memo` en este módulo; cambiar un test para que pase con el compiler.

## Success Criteria

1. SC1: un error de render en `/` muestra «Algo ha fallado», con su texto y «Recargar», a 1440 px y a 390 px, y no la pantalla en inglés del router.
2. SC2: un error de render por encima del router (en un proveedor) muestra la misma pantalla y no una página en blanco.
3. SC3: «Recargar» recarga la página en la misma URL.
4. SC4: el foco va al `h1` al aparecer; VoiceOver anuncia la pantalla una vez; axe sin infracciones.
5. SC5: el error sigue saliendo en la consola.
6. SC6: el React Compiler está activo: el build importa `react/compiler-runtime` y toda la suite pasa sin tocar los tests.
7. SC7: `pnpm check:task` pasa.

## Open Questions

Ninguna.
