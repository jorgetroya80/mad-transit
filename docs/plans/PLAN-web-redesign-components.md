# Plan: web-redesign-components

- Created: 2026-11-02
- Status: **approved** (2026-11-02)
- Spec: [SPEC-web-redesign-components.md](../specs/SPEC-web-redesign-components.md)

## Overview

Llevar al rediseño las piezas que ya existen, cada una en su sitio: insignia con etiqueta, fila con distancia y minutos a pie, selector «Sacar bici / Dejar bici» en tarjetas y píldora, buscador con ayuda y botón de borrar, avisos con variantes y puntos del mapa de 40 px. Cada pieza cambiada pasa un test de `axe-core`. Se ven en escritorio y en móvil; la composición de la pantalla llega con `web-redesign-desktop`.

## Decisiones de implementación

- **Rama `feat/web-redesign-components`, un PR y un commit por tarea.** Sin `Co-Authored-By`. El PR toca `web/` y `docs/`. Título `feat(web): restyle the station pieces for the redesign`: cambia lo que ve el usuario, así que publica una release de la web.
- **Primero la base de los tests (T1).** `axe-core` y el *helper* van antes que cualquier componente, para que cada tarea añada su test de axe.
- **La etiqueta del nivel, en `entities/station/ui/availabilityStatusText.ts`.** `availabilityLabel` ya existe (la cifra o el guion de `off`) y lo usan la insignia y el mapa; el texto nuevo («Disponible», «Pocas»…) va en otra función para no mezclar los dos.
- **Tamaños por breakpoint con clases `md:`.** La insignia y el selector cambian de tamaño o de variante con CSS donde se pueda; solo el selector necesita `variant`, porque las tarjetas y la píldora tienen distinto contenido. `MapPanel` elige la variante con `useMediaQuery(MD_MEDIA_QUERY)`.
- **Textos de los tests.** Cambiar «Bicis / Anclajes» por «Sacar bici / Dejar bici» reescribe aserciones, que el floor guard marca como avisos. Se explican en el commit de cada tarea, como en `web-data-state`.
- **Iconos a mano.** Cada SVG es un componente pequeño en `shared/ui/icons/` con `aria-hidden` y trazo de 2 px. Solo los que usa este módulo: bici, anclaje, borrar, aviso, sin conexión e información.

## Grafo de dependencias

```
T1 axe-core + iconos
   │
   ├─► T2 insignia con etiqueta ─► T3 fila con minutos a pie
   │
   ├─► T4 selector «Sacar bici / Dejar bici»
   │
   ├─► T5 buscador: ayuda, borrar y Escape
   │
   ├─► T6 StatusBanner
   │
   └─► T7 puntos del mapa de 40 px + cierre
```

T2 a T6 solo dependen de T1 y no comparten archivos; van en serie para tener un commit revisable por tarea. T3 usa la insignia de T2.

## Task List

### Fase 1: Base y estación

- [x] **T1: `axe-core` e iconos** (S, ~45 min)
  - Descripción: instalar `axe-core@4.14.0` exacta en `devDependencies`. `web/test/axe.ts` exporta `expectNoAxeViolations(container)`, que llama a `axe.run` y falla con el id, la ayuda y los nodos de cada infracción. `shared/ui/icons/` con los iconos de este módulo, exportados desde `shared/ui`.
  - Aceptación:
    - Un test del *helper* pasa con un botón con nombre y falla con un botón vacío.
    - Cada icono se renderiza con `aria-hidden="true"` y trazo de 2 px.
  - Verificación: `pnpm --filter web exec vitest run test src/shared/ui/icons`.
  - Archivos: `web/package.json`, `pnpm-lock.yaml`, `web/test/{axe.ts,axe.test.ts}`, `web/src/shared/ui/icons/*`, `web/src/shared/ui/index.ts`.
  - Dependencias: ninguna.

- [ ] **T2: Insignia con etiqueta** (M, ~1 h)
  - Descripción: `availabilityStatusText(level, need)` con los textos del lienzo (`good` «Disponible»; `low` «Pocas» / «Pocos»; `empty` «Sin bicis» / «Sin hueco»; `off` «Fuera de servicio»; `unconfirmed` «Sin confirmar»). `AvailabilityBadge` pasa a píldora de 40 × 30 px y 44 × 32 px desde `md`, con la etiqueta debajo en `text-availability-*-label`. Prop `decorative`: dentro de la fila, todo `aria-hidden`; en el detalle, conserva su texto para lectores de pantalla.
  - Aceptación:
    - Los cinco niveles en los dos modos muestran cifra y etiqueta (SC1).
    - Con `decorative`, la insignia no aporta texto accesible; sin él, sí.
    - axe sin infracciones.
  - Verificación: `pnpm --filter web exec vitest run src/entities/station/ui src/widgets/station-detail`.
  - Archivos: `entities/station/ui/{availabilityStatusText.ts,availabilityStatusText.test.ts,AvailabilityBadge.tsx,AvailabilityBadge.test.tsx}`, `widgets/station-detail/ui/StationFields.tsx`.
  - Dependencias: T1.

- [ ] **T3: Fila con minutos a pie** (S, ~1 h)
  - Descripción: `formatWalk(meters)`: minutos a 80 m/min, redondeado hacia arriba, mínimo 1 («1 min a pie»). `StationRow`: chip con el número, nombre completo, que salta de línea en lugar de truncarse, «57 m · 1 min a pie» y la insignia `decorative`. Nombre accesible: «Estación 33, Puerta del Sol, 57 metros, 1 minuto a pie, 3 bicis».
  - Aceptación:
    - `formatWalk` con 0, 80, 81 y 1000 m.
    - Un nombre largo se ve entero.
    - El nombre accesible incluye distancia y minutos, y «, sin confirmar» cuando toca (SC2).
    - axe sin infracciones.
  - Verificación: `pnpm --filter web exec vitest run src/entities/station src/widgets/station-list`.
  - Archivos: `entities/station/ui/{formatWalk.ts,formatWalk.test.ts,StationRow.tsx,StationRow.test.tsx}`, `entities/station/index.ts`.
  - Dependencias: T2.

### Checkpoint: Fase 1

- [ ] `pnpm check:task` en verde, salvo los avisos de aserciones reescritas explicados en los commits.
- [ ] `dev:mock` en escritorio y móvil: filas e insignias con el aspecto del lienzo.

### Fase 2: Controles

- [ ] **T4: Selector «Sacar bici / Dejar bici»** (M, ~1 h 15 min)
  - Descripción: `NeedToggle` con `variant: 'cards' | 'pill'`. Grupo con `legend` oculta «¿Qué quieres hacer?»; botones «Sacar bici» y «Dejar bici» con `aria-pressed`. `cards`: icono, título y subtítulo («Bicis disponibles» / «Anclajes libres»). `pill`: solo el título, compacto. `MapPanel` usa `cards` desde `md` y `pill` por debajo. Los textos «Bicis disponibles» / «Anclajes disponibles» de las cabeceras de lista no cambian aquí.
  - Aceptación:
    - Las dos variantes cambian `?need` y marcan el botón pulsado.
    - El grupo se llama «¿Qué quieres hacer?».
    - `MapPanel` muestra tarjetas desde `md` y píldora por debajo (SC3).
    - axe sin infracciones en las dos variantes.
  - Verificación: `pnpm --filter web exec vitest run src/features/filter-by-need src/pages`.
  - Archivos: `features/filter-by-need/ui/{NeedToggle.tsx,NeedToggle.test.tsx}`, `pages/map/ui/MapPanel.tsx`, tests de páginas y widgets que buscan «Bicis» o «Anclajes» por nombre de botón.
  - Dependencias: T1.

- [ ] **T5: Buscador con ayuda y botón de borrar** (S, ~1 h)
  - Descripción: `SearchInput` con etiqueta «Buscar estación», ayuda «Busca por número de estación.» como `aria-describedby`, `type="search"` y un botón «Borrar búsqueda» (icono con nombre accesible) que aparece con texto, vacía y devuelve el foco al campo. Escape vacía el campo (además de cerrar la lista, como hoy).
  - Aceptación:
    - La ayuda es la descripción accesible del campo.
    - Borrar y Escape vacían; borrar deja el foco en el campo.
    - Los tests de coincidencia por número siguen pasando sin cambios (SC4).
    - axe sin infracciones con y sin resultados.
  - Verificación: `pnpm --filter web exec vitest run src/features/search-by-number src/widgets/transit-search`.
  - Archivos: `features/search-by-number/ui/{SearchInput.tsx,SearchByNumber.tsx,SearchByNumber.test.tsx}`, `features/search-by-number/model/useNumberSearch.ts` si hace falta una acción de vaciar.
  - Dependencias: T1.

- [ ] **T6: `StatusBanner`** (S, ~45 min)
  - Descripción: `shared/ui/panel-notice/PanelNotice.tsx` pasa a `shared/ui/status-banner/StatusBanner.tsx` con `variant: 'info' | 'stale' | 'offline'`, icono y `action` opcional. `info` y `stale`: `role="status"`; `offline`: `role="alert"`. Colores `notice-*` de cada variante. Llamadores: aviso de ubicación (`info`), `StaleNotice` (`stale`) y «Sin conexión» (`offline`) en lista y detalle, con sus textos de hoy.
  - Aceptación:
    - Cada variante tiene su rol, su icono y sus colores.
    - La acción opcional se pinta como botón.
    - No queda ningún `PanelNotice`.
    - axe sin infracciones en las tres variantes.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui src/widgets`.
  - Archivos: `shared/ui/status-banner/*`, `shared/ui/panel-notice/*` (borrado), `shared/ui/index.ts`, `shared/ui/data-freshness/StaleNotice.tsx`, `widgets/station-list/ui/StationList.tsx`, `widgets/station-detail/ui/StationInfo.tsx`.
  - Dependencias: T1.

### Checkpoint: Fase 2

- [ ] `pnpm check:task` en verde, salvo los avisos explicados.
- [ ] `dev:mock` con Tab: buscador → modo → aviso → lista, con foco visible.

### Fase 3: Mapa y cierre

- [ ] **T7: Puntos del mapa de 40 px, límites de zoom y cierre** (S, ~1 h)
  - Descripción: `POINT_RADIUS_PX` a 20 y `SELECTED_POINT_RADIUS_PX` a 24, con el anillo `primary` del seleccionado (de `web-design-tokens`) y el número a un tamaño legible dentro del círculo. `MAP_MIN_ZOOM` (12) y `MAP_MAX_ZOOM` (18) en `shared/config`, pasados como `minZoom` y `maxZoom` al crear el mapa en `useMapLibre.ts`. Comprobar a la vista con el zoom inicial y con el 12. Changelog del plan.
  - Aceptación:
    - `pointLayers()` usa radio 20 y 24 y el seleccionado se dibuja encima.
    - El mapa se crea con `minZoom` 12 y `maxZoom` 18 (test sobre las opciones de `Map`).
    - En `dev:mock`, los puntos se leen con el zoom inicial (SC5); si se tapan demasiado, parar y preguntar antes de cambiar tamaño o zoom.
    - SC6 y SC7: axe en cada pieza cambiada y `pnpm check:task`.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map`; `pnpm check:task`; recorrido manual.
  - Archivos: `shared/ui/base-map/{points.ts,points.test.ts,useMapLibre.ts}` y su test, `shared/config/{constants.ts,index.ts,index.test.ts}`, este plan.
  - Dependencias: T2-T6.

### Checkpoint final

- [ ] SC1-SC7 comprobados; CI en verde.
- [ ] Pedir permiso antes de push, abrir el PR y hacer merge.
- [ ] Después del despliegue: comprobar en Render, escritorio y móvil; marcar spec, plan y capability map como **implemented**.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| 600 puntos de 40 px se tapan al alejar | Medio | `minZoom` 12 limita cuánto se aleja; comprobación visual en T7 antes del PR; preguntar antes de cambiar el tamaño |
| axe en jsdom da falsos positivos (contraste, que jsdom no calcula) | Medio | El *helper* desactiva solo `color-contrast`, que ya se comprobó con los tokens; el resto de reglas, activas |
| La insignia más alta con etiqueta descuadra la fila en móvil | Bajo | Revisión en el checkpoint de la fase 1 |
| Muchos tests buscan «Bicis» y «Anclajes» por nombre de botón | Bajo | Se cambian en T4 con el texto nuevo, explicados en el commit |

## Paralelización

T2, T4, T5 y T6 dependen solo de T1 y no comparten archivos, así que podrían ir en paralelo. Se hacen en serie para que cada commit sea pequeño y revisable.

## Estimación

Unas 6 h 45 min en total. Fase 1 ~2 h 45 min, fase 2 ~3 h y fase 3 ~1 h.

## Changelog

- 2026-11-02: borrador a partir de la spec aprobada.
- 2026-11-02: T7 añade los límites de zoom 12 y 18, a petición del usuario.
- 2026-11-02: aprobado por el usuario.
- 2026-11-02: T1 hecha. `axe-core` 4.14.0 exacta en `devDependencies`. `expectNoAxeViolations` lanza un error con el id, la ayuda y el selector de cada nodo, y solo desactiva `color-contrast`; los tests lo importan con ruta relativa, como `renderWithRouter`. Los seis iconos comparten `IconFrame` (viewBox 24, `currentColor`, trazo 2, `aria-hidden`) en `shared/ui/icons/icons.tsx` y se exportan desde `shared/ui`. 8 tests nuevos (486 en total) y `check:task` en verde.
