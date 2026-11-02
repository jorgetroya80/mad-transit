# Spec: web-redesign-components

- Created: 2026-11-02
- Status: **approved** (2026-11-02)
- Plan: [PLAN-web-redesign-components.md](../plans/PLAN-web-redesign-components.md)

Módulo `web-redesign-components` del [Capability Map](CAPABILITY-MAP.md), el tercero del rediseño de la UI. Cubre la parte de la fase 3 («Componentes atómicos») del documento «Mad Transit — Especificación de UI» (revisión 32) y del lienzo «Mad Transit · rediseño», que son privados, que ya tiene un componente en el repo: cada pieza se evoluciona en su sitio, sin componentes paralelos. Las piezas nuevas (cabecera, indicador de actualización, tarjeta de estación, leyenda, controles del mapa, favoritas plegables) llegan con `web-redesign-desktop`, donde se colocan.

## Objective

Que las piezas que el usuario ya ve (filas, insignias, selector de modo, buscador, avisos y puntos del mapa) tengan el aspecto, los textos y la accesibilidad del rediseño, en escritorio y en móvil.

- Como usuario, cada fila me dice la distancia y los minutos a pie, y su insignia lleva una etiqueta («Disponible», «Pocas», «Sin bicis»…) además del número.
- Como usuario, elijo entre «Sacar bici» y «Dejar bici», no entre «Bicis» y «Anclajes».
- Como usuario, el buscador me dice qué puedo buscar (el número de la estación) y lo vacío con un botón o con Escape.
- Como usuario de lector de pantalla, cada pieza tiene nombre, rol y estado correctos, y lo comprueba un test automático.

**Fuera de alcance:** la composición de la pantalla de escritorio y las piezas nuevas (`web-redesign-desktop`); el bottom sheet de tres alturas (`web-redesign-mobile`); los textos y estados de error, `stale`, `offline` y búsqueda sin resultados del diseño (`web-error-states`); el estado «seleccionada» de la fila, que solo tiene sentido cuando la lista sigue visible con una estación abierta (`web-redesign-desktop`).

## Decisiones (2026-11-02, del usuario)

1. **Dividir `web-redesign-desktop`.** Este módulo hace las piezas que ya existen; `web-redesign-desktop`, la pantalla y las piezas nuevas. Dos PR de unas 7 h en lugar de uno de 14 h.
2. **Buscador.** Se queda el desplegable de hoy sobre todas las estaciones (~600), no un filtro de la lista de cercanas, y sigue buscando solo por número, como los endpoints por número del API (`/v1/bicimad/stations/{number}` y `/v1/bus/stops/{number}`). La búsqueda por nombre y calle del diseño se descarta (2026-11-02): las paradas de bus no traen dirección y el usuario prefiere el mismo comportamiento en los dos servicios.
3. **Tarjeta de estación** (para `web-redesign-desktop`): número, distancia, nombre, bicis, anclajes libres y la estrella de favorita. Sin dirección, anclajes totales ni «En servicio».
4. **Móvil hasta `web-redesign-mobile`.** Las piezas nuevas también se ven en móvil (son los mismos componentes); el bottom sheet y el detalle en el panel siguen como hoy.

## Assumptions

1. **Insignia** (`entities/station/ui/AvailabilityBadge.tsx`). Píldora de 44 × 32 px desde `md` y 40 × 30 px por debajo, con la etiqueta visible debajo en el color `availability-*-label` del nivel. Etiquetas del lienzo: `good` «Disponible»; `low` «Pocas» (bicis) o «Pocos» (anclajes); `empty` «Sin bicis» o «Sin hueco»; `off` «Fuera de servicio»; `unconfirmed` «Sin confirmar». Dentro de la fila es decorativa (`aria-hidden`): la fila da el texto completo. En el detalle, que no es una fila, sigue teniendo su texto para lectores de pantalla.
2. **Fila** (`entities/station/ui/StationRow.tsx`). Chip con el número, nombre completo en hasta 2 líneas (sin truncar), «57 m · 1 min a pie» e insignia. Minutos a pie: distancia del API entre 80 m/min, redondeado hacia arriba, mínimo 1 (`formatWalk` junto a `formatDistance`). Nombre accesible del `<button>`: «Estación 33, Puerta del Sol, 57 metros, 1 minuto a pie, 3 bicis» (con «, sin confirmar» cuando toca, como hoy).
3. **Selector de modo** (`features/filter-by-need/ui/NeedToggle.tsx`). Grupo «¿Qué quieres hacer?» (`fieldset` + `legend` oculta), dos botones con `aria-pressed`: «Sacar bici» y «Dejar bici». Dos variantes: `cards` (icono SVG y subtítulo «Bicis disponibles» / «Anclajes libres») desde `md` y `pill` por debajo. El código y la URL siguen diciendo `need`, `bikes` y `docks`.
4. **Buscador** (`features/search-by-number`). Etiqueta «Buscar estación», ayuda «Busca por número de estación.» unida con `aria-describedby`, `type="search"`, botón de borrar con nombre accesible «Borrar búsqueda» que devuelve el foco al campo, y Escape lo vacía. La coincidencia no cambia (`matchByNumber`: número que empieza por la consulta, primero el exacto, hasta `SEARCH_MAX_RESULTS`).
5. **Avisos** (`shared/ui/panel-notice/PanelNotice.tsx`). Pasa a `StatusBanner` con `variant: 'info' | 'stale' | 'offline'`, icono SVG y acción opcional. Roles del diseño: `info` y `stale` con `role="status"`, `offline` con `role="alert"`. Los textos de hoy se mantienen; los del diseño llegan con `web-redesign-desktop` (ubicación) y `web-error-states` (fallos).
6. **Puntos del mapa** (`shared/ui/base-map/points.ts`). Círculo de 40 px (radio 20) con el número, y el seleccionado más grande (radio 24) con anillo `primary`, por encima del resto. Siguen siendo capas de MapLibre, no botones. Hoy son de 24 px: se revisa a la vista que 600 puntos de 40 px se puedan leer con el zoom inicial. El mapa limita el zoom entre 12 (`MAP_MIN_ZOOM`, alejado) y 18 (`MAP_MAX_ZOOM`, nivel de calle) con las opciones `minZoom` y `maxZoom` de MapLibre; hoy va de 0 a 22.
7. **Iconos.** SVG en línea con trazo de 2 px y `aria-hidden="true"`, en `shared/ui/icons/`. Sin dependencias ni emoji.
8. **Accesibilidad automática.** `axe-core` 4.14.0 (publicado el 2026-10-05) en `devDependencies`, con un *helper* propio de unas 10 líneas en `web/test/axe.ts`. Sustituye a `vitest-axe`, que se aprobó el 2026-10-31 pero no tiene versión estable desde 2022 (0.1.0; la 1.0 sigue en *pre*). Cada componente de este módulo tiene un test sin infracciones de axe.

## Tech Stack

El de [web-data-state](SPEC-web-data-state.md#tech-stack) más `axe-core` 4.14.0 exacta en `devDependencies`.

## Commands

```bash
pnpm --filter web add -D axe-core@4.14.0 --save-exact
pnpm --filter web dev:mock
pnpm --filter web test
pnpm --filter web test:coverage
pnpm --filter web depcruise
pnpm check:task
```

Manual en `dev:mock`, en escritorio y en móvil (DevTools): filas, insignias, selector de modo, buscador (ayuda, borrar y Escape), avisos, y los puntos de 40 px con el zoom inicial.

## Project Structure

```
web/
  package.json                                  + axe-core (devDependencies, exacta)
  test/axe.ts                                   expectNoAxeViolations(container)
  src/shared/ui/icons/                          SVG en línea (bici, anclaje, buscar, borrar, aviso…)
  src/shared/ui/panel-notice/                   PanelNotice → StatusBanner con variantes
  src/shared/ui/base-map/points.ts              puntos de 40 px, seleccionado con anillo
  src/entities/station/ui/
    AvailabilityBadge.tsx                       píldora + etiqueta visible
    availabilityLabel.ts                        etiqueta por nivel y modo
    StationRow.tsx                              chip, nombre completo, distancia y minutos
    formatWalk.ts                               minutos a pie a 80 m/min
  src/features/filter-by-need/ui/NeedToggle.tsx «Sacar bici / Dejar bici», variantes cards y pill
  src/features/search-by-number/ui/             etiqueta, ayuda, borrar y Escape
  src/pages/map/ui/MapPanel.tsx                 elige la variante del selector por breakpoint
```

## Code Style

El de [web-bicimad](SPEC-web-bicimad.md#code-style). Cada componente lleva su test de axe junto a los de comportamiento:

```tsx
it('has no accessibility violations', async () => {
  const { container } = render(<NeedToggle variant="cards" />);

  await expectNoAxeViolations(container);
});
```

- Textos visibles en español; nombres accesibles completos en la fila, no en sus hijos.
- Clases enteras en mapas (`satisfies Record<…>`) para que Tailwind las encuentre.

## Testing Strategy

- Vitest, Testing Library y MSW, como hoy; `axe-core` en cada componente que cambia.
- Insignia: etiqueta de cada nivel en los dos modos; tamaño por breakpoint; decorativa dentro de la fila.
- Fila: nombre largo completo; «57 m · 1 min a pie»; minutos para 0, 80, 81 y 1000 m; nombre accesible.
- Selector: `aria-pressed`, nombre del grupo, las dos variantes y que cambia `?need`.
- Buscador: la ayuda es la descripción accesible del campo; Escape vacía; borrar vacía y devuelve el foco al campo; los tests de coincidencia por número de hoy siguen pasando.
- `StatusBanner`: rol por variante y acción opcional.
- Puntos: radio 20 y 24, anillo del seleccionado.
- Cobertura ≥ 80 % por capa; `pnpm --filter web depcruise` sin violaciones.

## Boundaries

- **Siempre:** evolucionar el componente que existe; tokens del tema; `<button>` nativo; color nunca solo.
- **Preguntar antes:** cualquier dependencia más allá de `axe-core`; textos distintos de los del diseño; cambiar la URL (`?need`, `?station`).
- **Nunca:** componentes paralelos a los existentes; marcadores como botones del DOM; hex fuera de `index.css`.

## Success Criteria

1. SC1: la insignia muestra número y etiqueta del lienzo en los cinco niveles y los dos modos.
2. SC2: la fila muestra el nombre completo y «N m · N min a pie»; su nombre accesible incluye distancia, minutos y disponibilidad.
3. SC3: el selector dice «Sacar bici / Dejar bici», con tarjetas desde `md` y píldora por debajo.
4. SC4: el buscador muestra la etiqueta y la ayuda del diseño, se vacía con su botón o con Escape y sigue encontrando por número.
5. SC5: los puntos del mapa miden 40 px y el seleccionado lleva anillo `primary`; se leen con el zoom inicial, y el zoom no baja de 12 ni sube de 18.
6. SC6: cada componente cambiado pasa axe sin infracciones.
7. SC7: `pnpm check:task` pasa.

## Open Questions

Ninguna.

## Changelog

- 2026-11-02: borrador a partir del documento de diseño (revisión 32) y del lienzo, con las decisiones 1 a 4 del usuario.
- 2026-11-02: el buscador sigue buscando solo por número (decisión 2, revisada por el usuario tras comprobar que el API busca por número en los dos servicios).
- 2026-11-02: el usuario aprueba `axe-core` 4.14.0 en lugar de `vitest-axe` (supuesto 8).
- 2026-11-02: aprobada por el usuario.
- 2026-11-02: el mapa limita el zoom entre 12 y 18 (supuesto 6), a petición del usuario, para que los puntos de 40 px no se amontonen al alejar.
