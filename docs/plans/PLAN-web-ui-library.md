# Plan: web-ui-library

- Created: 2026-11-10
- Status: **approved** (2026-11-10)
- Spec: [SPEC-web-ui-library.md](../specs/SPEC-web-ui-library.md)

## Overview

Construir en `web/src/shared/ui` la librería genérica de la sección «Librería de componentes» del documento (rev 54): base común (tokens, `focus-ring`, `Tone`, `Icon`, `Spinner`), las 15 piezas de HTML y `MapPoint` (`drawMapPoint`, `mapPointImageId`). Además, la página temporal `/dev/components`, solo en desarrollo, para revisarla contra el tablero. Ninguna pantalla cambia: las piezas viejas y sus tokens siguen hasta `web-ui-migration`.

## Decisiones de implementación

- **Rama `feat/web-ui-library`, un PR y un commit por tarea.** Sin `Co-Authored-By`. El PR toca `web/` y `docs/`. Título `refactor(web): add the generic component library` (supuesto 14): sin release. La spec, este plan y el capability map van en el commit de T1.
- **Primero la base y lo de más riesgo.** T1 deja los tokens, los 21 iconos sacados del tablero, la ruta solo de desarrollo y el test de palabras de dominio, que vigila todas las tareas siguientes. T8 (`MapPoint`) lleva `canvas`, `roundRect` y `Path2D`, sin DOM.
- **Cada tarea es una porción vertical:** sus piezas, sus tests (estados, axe, textos de dos dominios) y su sección en `/dev/components`. Al acabar cada tarea se puede ver lo hecho en el navegador.
- **El orden sigue la composición:** primero lo que otras piezas usan dentro (`Icon`, `Spinner`, `Button`, `IconButton`), después lo que los usa (`SearchField` usa `IconButton`; `Banner` y `EmptyState` usan `Button`; `ListItem` y `Card` usan `CountBadge`, `Tag`, `StatTile` e `IconButton`).
- **Los tokens viejos pasan a alias solo donde el hex coincide** (supuesto 2). T1 compara cada par y apunta en el changelog los que se quedan con su valor.
- **Los dibujos de los iconos salen del SVG del tablero** (`Components.dc.html`, sección «Iconos · 21 nombres»), pasados a datos: lista de trazos `d` por nombre, con `circle`, `rect` y `line` pasados a `path`. Así sirven igual para `<Icon>` y para `Path2D`.
- **Sin dependencias nuevas.** El `canvas` de los tests es un pintor falso, como hoy en `pointImage.test.ts`.

## Grafo de dependencias

```
T1 base: tokens, focus-ring, Tone, Icon (21), Spinner, /dev/components, test de dominio
 │
 ├─► T2 Button, IconButton ─┬─► T3 SegmentedControl, SearchField
 │                           │
 │                           └─► T4 Banner, EmptyState, StatusText
 │
 ├─► T5 CountBadge, Tag, StatTile, Legend ─┐
 │                                          ├─► T6 ListItem, Disclosure ─► T7 Card, ControlGroup
 │                     (T2) ────────────────┘
 │
 └─► T8 MapPoint: drawMapPoint, mapPointImageId   (solo usa los datos de Icon)

T1–T8 ─► T9 cierre: build sin /dev/components, tokens text-sheet-*, revisión visual, docs
```

## Task List

### Fase 1: Base y controles

- [x] **T1: Base común y página de revisión** (L, ~2 h 30 min)
  - Descripción:
    - **Tokens en `index.css`:** `tone-*` de los 7 tonos (solo los que tienen valor propio), `tone-warning-dot`, `surface-disabled`, `line-subtle`, `tag`, `tag-inverse`, `tag-ring`, `text-*` con tamaño, `--line-height` y `--font-weight` (`text-sheet-*` solo con tamaño, ver changelog), `radius-segment`, `-float` y `-tag`, y `shadow-segment` y `shadow-pill`.
    - **Alias:** `availability-*`, `notice-*` y `primary-*` pasan a `var(--color-tone-…)` donde el hex coincide.
    - **Foco:** `@utility focus-ring`, que lee `--focus-ring-color` con `primary` por defecto.
    - **Base de piezas:** `shared/ui/tone` (tipo `Tone`, `toneLineStyle`); `shared/ui/icons` gana `Icon` (`name`, `size` 16 | 18 | 20 | 22 | 24 | 30 | 34, trazo según nombre y tamaño) con los 21 dibujos del tablero como datos; `shared/ui/spinner` (`Spinner`, quieto con movimiento reducido).
    - **Página de revisión:** ruta `/dev/components` solo con `import.meta.env.DEV`, con carga diferida, y `pages/dev-components` con las secciones «Tonos» e «Iconos».
    - **Test de palabras de dominio:** recorre los `.tsx` de la librería, sin tests ni `pages/`.
  - Aceptación:
    - Los 21 nombres pintan su SVG con `aria-hidden` y el trazo del documento; cada `d` construye un `Path2D` válido.
    - Ningún test de pantalla cambia: los alias valen lo mismo que hoy (lista de pares en el changelog).
    - `/dev/components` abre en `pnpm --filter web dev` y la página pasa axe.
    - El test de dominio falla si una pieza escribe «estación», «parada», «BiciMAD», «bici» o «autobús».
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui src/pages/dev-components src/app`; `pnpm check:task`.
  - Archivos: `app/styles/index.css`, `app/router.tsx` (+ test), `shared/ui/{tone,icons,spinner}/*`, `shared/ui/index.ts`, `pages/dev-components/*`, un test de dominio en `shared/ui`, spec, capability map y este plan.
  - Dependencias: ninguna.

- [x] **T2: `Button` e `IconButton`** (M, ~1 h 15 min)
  - Descripción: `Button` (`primary`, `secondary`, `outline` con `tone` `warning`/`danger`; `sm` 40 con área de 44 por `::after`, `md` 44, `lg` 48; icono; `busy` con `Spinner`, `aria-busy` y `aria-disabled`). `IconButton` (`ghost`, `outline`, `floating`; `md` 44, `lg` 48; `pressed` + `pressedIcon`; `iconTone`; `tooltip` como `title`; `busy`; `disabled`). Los dos con `focus-ring`. Sus secciones en `/dev/components`.
  - Aceptación:
    - Cada estado de las tablas del documento con su atributo y su clase de color; axe sin infracciones.
    - `IconButton` alternado conserva `label` como nombre, con `aria-pressed` y `star-filled`; `tooltip` solo cambia el `title`.
    - Ocupado no pierde el foco (`aria-disabled`, no `disabled`).
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/button src/shared/ui/icon-button`.
  - Archivos: `shared/ui/{button,icon-button}/*`, `shared/ui/index.ts`, `pages/dev-components/*`.
  - Dependencias: T1.

- [x] **T3: `SegmentedControl` y `SearchField`** (M, ~1 h 30 min)
  - Descripción: `SegmentedControl` con `tray`, `cards` y `pill` (`soft`/`solid`), `fieldset`/`legend` o `role="group"` según `labelVisible`, `description` por `aria-describedby`, `busyValue`, opción y grupo desactivados. `SearchField` con `box`/`pill`, etiqueta visible u oculta, lupa o `Spinner`, borrar con `IconButton` y `clearLabel`, Escape borra y deja el foco, `hint`/`error` con `aria-describedby` y `aria-invalid`, `inputMode`, `disabled`. Sus secciones en la página.
  - Aceptación:
    - Tab y Enter/Espacio eligen segmento; una opción desactivada no recibe foco.
    - `SearchField` con los textos de estaciones y de paradas del documento; el error sustituye a la ayuda y no es región viva.
    - axe en cada estado.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/segmented-control src/shared/ui/search-field`.
  - Archivos: `shared/ui/{segmented-control,search-field}/*`, `shared/ui/index.ts`, `pages/dev-components/*`.
  - Dependencias: T2.

### Checkpoint: Base y controles

- [ ] `pnpm check:task` en verde; ningún test de pantalla reescrito (floor guard limpio).
- [ ] Revisión del usuario en `/dev/components`: tonos, iconos, botones, segmentos y buscador contra el tablero, a 1440 y a 390 px.

### Fase 2: Avisos y datos

- [ ] **T4: `Banner`, `EmptyState` y `StatusText`** (M, ~1 h 30 min)
  - Descripción: `Banner` (`info`, `warning`, `danger`, `inverse`; `card`/`bar`; `title` en negrita; acción `Button` `sm`; `announce`); en `inverse` define `--focus-ring-color` con `tone-inverse-foreground`. `EmptyState` (`danger`, `neutral`, `warning`; `md`/`sm`; círculo con icono; `h2`/`h3` con `tabIndex={-1}`; acción `lg`; `note`; `children`; `announce`). `StatusText` (4 tonos, con o sin punto, `md`/`sm`, `live`). Regiones vivas según el supuesto 11.
  - Aceptación:
    - `polite`/`status` es `<output>`, `alert` es `<div role="alert">` y `none` no tiene rol. Solo el título y el mensaje quedan dentro de la región; la acción, `note` y `children` quedan fuera.
    - `EmptyState` con `status` deja el `<h2>` fuera del `<output>`; su encabezado acepta `focus()` sin estar en el orden de Tab.
    - El `Button` dentro de `Banner` `inverse` lleva anillo blanco; axe en cada tono.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/banner src/shared/ui/empty-state src/shared/ui/status-text`.
  - Archivos: `shared/ui/{banner,empty-state,status-text}/*`, `shared/ui/index.ts`, `pages/dev-components/*`.
  - Dependencias: T2.

- [ ] **T5: `CountBadge`, `Tag`, `StatTile` y `Legend`** (M, ~1 h 15 min)
  - Descripción: `CountBadge` (6 tonos `solid`, `md`/`sm`, `srText`, `loading`; `danger` discontinuo). `Tag` (`default`/`inverse`, `ring`, `sm`/`md`, `srText`). `StatTile` (6 tonos `soft`, `statusLabel`, `srText`, `loading`). `Legend` (`inline`/`stacked`, `items` con `shape` y `lineStyle`, `<ul aria-label>`). Sus secciones en la página.
  - Aceptación:
    - Las clases de color de cada tono son las de las tablas; `danger` es discontinuo en badge y tesela, y `Legend` lo pinta continuo con `lineStyle: 'solid'`.
    - Con `srText`, lo visible queda `aria-hidden` y el lector oye la frase.
    - axe en cada tono.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/count-badge src/shared/ui/tag src/shared/ui/stat-tile src/shared/ui/legend`.
  - Archivos: `shared/ui/{count-badge,tag,stat-tile,legend}/*`, `shared/ui/index.ts`, `pages/dev-components/*`.
  - Dependencias: T1.

- [ ] **T6: `ListItem` y `Disclosure`** (M, ~1 h 15 min)
  - Descripción:
    - **`ListItem`:** pulsable (`<button>`, con `accessibleLabel` obligatorio por tipo cuando llega `onSelect`) o estática (`<div>`). Huecos `leading`/`leadingText`, `below` y `trailing`, más `trailingCaption`. Admite `selected` (`aria-current`), `busy` (con `busyLabel` obligatorio por tipo), `disabled` y `density`.
    - **`Disclosure`:** `<section aria-labelledby>` > `hN` con `tabIndex={-1}` > `<button aria-expanded aria-controls>`, panel con `hidden`. Recibe `title`, `count`, `icon` y `open`/`onOpenChange` o `defaultOpen`, con `headingLevel` y `size`. Flecha sin giro con movimiento reducido.
    - Sus secciones en la página.
  - Aceptación:
    - Una fila pulsable sin `accessibleLabel` o una fila `busy` sin `busyLabel` es un error de TypeScript (test de tipos con `expectTypeOf`; `web/AGENTS.md` prohíbe `@ts-expect-error`).
    - Composición: estación con `CountBadge`; parada con `Tag` en `below`; llegada estática con `IconButton` en `trailing`, sin botones anidados.
    - `Disclosure` controlada y no controlada; Enter/Espacio pliega y el foco se queda; axe.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/list-item src/shared/ui/disclosure`.
  - Archivos: `shared/ui/{list-item,disclosure}/*`, `shared/ui/index.ts`, `pages/dev-components/*`.
  - Dependencias: T2, T5.

### Checkpoint: Avisos y datos

- [ ] `pnpm check:task` en verde; floor guard limpio.
- [ ] Revisión del usuario en `/dev/components` de avisos, insignias, teselas, leyenda, filas y secciones plegables.

### Fase 3: Fichas, mapa y cierre

- [ ] **T7: `Card` y `ControlGroup`** (M, ~1 h 30 min)
  - Descripción:
    - **`Card`:** `Card.Header`, `Card.Body` y `Card.Footer`, montadas con `Object.assign`. Admite `elevation` `float`/`flat` y `as`.
    - **`Card.Header`:** `title` con `tabIndex={-1}`, `titleLevel` y `meta`, más los huecos `leadingAction`, `cornerActions` y `titleAction`.
    - **`Card.Body`:** `busy` y `busyLabel`.
    - **Escape:** `onEscape` en `Card`. `useCloseOnEscape` se mueve de `widgets/station-card/model` a `shared/lib`, y el widget solo cambia su `import`.
    - **`ControlGroup`:** `role="group"` con `label`, `vertical`/`horizontal`, separadores `line-subtle`.
    - Sus secciones en la página: la ficha de estación y la de parada con llegadas del documento.
  - Aceptación:
    - Escape desde cualquier control de dentro llama a `onEscape`; sin trampa de foco.
    - `Card.Body` `busy` muestra el `Spinner` con su `busyLabel` oculto y `aria-busy`.
    - Las dos fichas de ejemplo pasan axe; el test de `useCloseOnEscape` sigue igual en su nueva carpeta (si el floor guard avisa, se explica en el commit).
  - Verificación: `pnpm --filter web exec vitest run src/shared src/widgets/station-card`.
  - Archivos: `shared/ui/{card,control-group}/*`, `shared/lib/{dom/useCloseOnEscape*,index.ts}`, `widgets/station-card/{model,ui}` (solo el `import`), `shared/ui/index.ts`, `pages/dev-components/*`.
  - Dependencias: T2, T5, T6.

- [ ] **T8: `MapPoint`** (M, ~1 h 30 min)
  - Descripción: `shared/ui/map-point` con `drawMapPoint(ctx, params, pixelRatio)` y `mapPointImageId(params)`. Parámetros: `tone`, `value` o `icon`, `shape`, `fill` y `selected`.
    - **Círculo:** 40, ×1,2 seleccionado.
    - **Cuadrado:** 32 con radio 8 por `roundRect`; 40 con radio 10 seleccionado. El icono va en 16 por `Path2D`, con los datos de `Icon`.
    - **Bordes:** halo 2 `map-point-stroke`, `danger` continuo, `muted` sin halo, anillo 4 `map-point-selected-stroke`.
    - **Cifra:** Inter 15/700.
    - **Colores:** los recibe en un objeto de estilo leído una vez; la función no lee el CSS.
    - Sección en la página con un `<canvas>` por caso.
  - Aceptación:
    - Tabla de casos (6 tonos × normal y seleccionado, círculo con cifra, cuadrado con `bus`, `fill="tag"`) sobre un pintor falso: forma, tamaño, colores, halo y anillo.
    - `mapPointImageId` da el mismo id para los mismos parámetros y uno distinto en cuanto cambia uno.
    - `pointImage.ts` y el mapa de hoy no cambian.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/map-point src/shared/ui/base-map`.
  - Archivos: `shared/ui/map-point/*`, `shared/ui/index.ts`, `pages/dev-components/*`.
  - Dependencias: T1.

- [ ] **T9: Cierre** (S, ~45 min)
  - Descripción: `pnpm --filter web build` y búsqueda en `dist/` de un texto de la página («Librería de componentes» o el que lleve): no debe aparecer. Repaso de cada pieza contra su tabla del documento. Changelog de este plan al día.
  - Aceptación:
    - SC1 a SC6 de la spec comprobados; el build no incluye `/dev/components`.
  - Verificación: `pnpm check:task`; `pnpm --filter web build`.
  - Archivos: spec, capability map, este plan.
  - Dependencias: T1–T8.

### Checkpoint final

- [ ] SC1-SC7 comprobados; `pnpm check:task` y CI en verde.
- [ ] Revisión visual del usuario de todas las piezas en `/dev/components` (SC7).
- [ ] Pedir permiso antes de push, abrir el PR y hacer merge. Sin release. Después del merge, un PR `docs` pasa spec, plan y capability map a **implemented**, como en los módulos anteriores.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Un token viejo no coincide en hex con su `tone-*` y el alias cambia un color en pantalla | Medio | T1 compara cada par antes de hacer el alias; los que no coinciden se quedan con su valor y se apuntan en el changelog |
| Los dibujos del tablero usan algo que no es trazo (relleno, texto) o se ven mal a 16 px | Medio | T1 los pasa a datos uno a uno y los mira en la sección «Iconos» a cada tamaño; si uno falla, se pide al diseñador |
| La ruta de desarrollo se cuela en el build de producción | Medio | Carga diferida bajo `import.meta.env.DEV`; T1 lo comprueba con un test del router y T9 buscando en `dist/` |
| `roundRect` o `Path2D` no existen en jsdom | Bajo | Pintor falso en los tests, como en `pointImage.test.ts`; el `canvas` real se mira en la página |
| Mover `useCloseOnEscape` hace que el floor guard avise de aserciones borradas | Bajo | Mover el test sin cambiarlo y explicarlo en el commit, como en módulos anteriores |
| Los tipos que exigen texto según el caso complican el uso | Bajo | Tipos de dos variantes con nombres claros y un test de tipos por pieza con `expectTypeOf` |

## Paralelización

Tras T1, las ramas T2 → T3/T4, T5 → T6 → T7 y T8 son independientes entre sí. Pero todas tocan `shared/ui/index.ts` y la página de revisión, así que se hacen en serie: una tarea, un commit.

## Estimación

Unas 13 h en total: fase 1 ~5 h 15 min, fase 2 ~4 h y fase 3 ~3 h 45 min.

## Changelog

- 2026-11-10: borrador a partir de la spec aprobada.
- 2026-11-10: aprobado por el usuario.
- 2026-11-10: T1 hecha (con el agente `frontend-developer`). 44 tokens `tone-*` más `tone-warning-dot`, `surface-disabled` `#f3f5f8`, `line-subtle` `#e6eaef`, `tag` `#2b333e`, `tag-inverse` `#14181f` y `tag-ring` `#8a95a3`; radios `tag` 6, `segment` 9 y `float` 14; sombras `segment` y `pill`; los 8 `text-*` nuevos con tamaño, interlineado y peso. Alias (mismo hex en los dos lados, comprobado con un script): `primary`, `-foreground`, `-soft` y `-soft-border` → `tone-info`, `-foreground`, `-soft` y `-soft-line`; `notice-stale`, `-line`, `-foreground` e `-icon` → `tone-warning-soft`, `-soft-line`, `-soft-foreground` e `-icon`; `notice-error` y `-foreground` → `tone-danger-soft` y `-soft-foreground`; `notice-offline` y `-foreground` → `tone-inverse` y `-foreground`; `availability-good`, `-low`, `-empty`, `-off` y `-unconfirmed` con sus `-foreground`, `-line` y `-label` → `tone-success`, `-warning`, `-danger`, `-neutral` y `-muted`. Se quedan con su valor: `availability-off-label` `#4b5563` (`tone-neutral-label` es `#4a5462`) y `primary-hover` `#08427d` (sin tono). `chip` y `fg-muted` coinciden con tonos `neutral` pero no se tocan (fuera del alcance). `tone-warning-soft-foreground` es `#3d2a00`, el texto de aviso del documento; `#2a1e00` sigue en `tone-warning-foreground`. Los 21 iconos salen del tablero como datos (`iconDrawings.ts`, `circle` y `rect` pasados a trazo); trazo 2,2 en `close`, `chevron-*`, `arrow-left`, `locate`, `plus` y `minus`, y 2 en el resto (la rev 54 quita el 2,4). Dibujos distintos a los de hoy: `dock` (una «P» en un cuadrado), `refresh` (una flecha), `bike`; `cloud-alert` tiene el contorno casi cerrado y el punto de `wifi-off` es un círculo de radio 0,6. El viejo `Icon.tsx` (`IconFrame`) pasa a `IconFrame.tsx` para que `Icon` tome el nombre; los 14 iconos de hoy no cambian. `Spinner` acepta `size` (16 a 24 en el tablero), con trazo 2,4. Decisión del usuario: `text-sheet-title` y `text-sheet-subtitle` se quedan solo con el tamaño hasta `web-ui-migration`, porque el interlineado del documento bajaba unos 5 px la cabecera del panel móvil. `focus-ring` no sale en el CSS de producción hasta que una clase lo use. Decisión del usuario: las pocas clases que solo usa `/dev/components` entran en el CSS de producción (unos cientos de bytes, sin JS ni textos), porque quitarlas con `@source not` las quitaría también en desarrollo. El test de palabras de dominio recorre todo `shared/ui` con `import.meta.glob` y no necesita excepciones. `pnpm check:task` en verde: 1075 tests en web, floor guard limpio; el build no incluye la página ni su chunk.
- 2026-11-10: T2 hecha (con el agente `frontend-developer`). `Button` y `IconButton` en `shared/ui`, con sus secciones en `/dev/components` (y `SpecimenRow`, una fila de estados con su nombre, para las tareas siguientes). Decisiones fuera del documento: `outline` + `danger` copia a `warning` con los tokens `tone-danger-soft-foreground`, `-icon` y `-soft`; `tone` es obligatorio con `outline` y no existe en las demás variantes (tipo de dos variantes); los colores de pulsado siguen al tablero; `primary` desactivado lleva el borde de 1 px `line-strong` del documento y todas las variantes tienen borde de 1 px para que la altura no cambie; ocupado y desactivado quitan hover y pulsado, ocupado anula el clic (también en `submit`) y desactivado gana a ocupado; `Button` ocupado muestra un `Spinner` de 18 aunque no tenga icono; `IconButton` usa 24 px solo para `star` y `star-filled`, y alternado pinta el icono en `primary` sea cual sea `iconTone`. El test de tipos usa `expectTypeOf` (`label` obligatorio), porque `web/AGENTS.md` prohíbe `@ts-expect-error`; T6 lo hará igual. 85 tests nuevos de las dos piezas; `pnpm check:task` en verde (1166 tests en web, floor guard limpio).
- 2026-11-10: T3 hecha (con el agente `frontend-developer`). `SegmentedControl` (`tray`, `cards`, `pill`) y `SearchField` (`box`, `pill`), con sus secciones en `/dev/components`, donde cada ejemplo guarda su estado y se puede probar con ratón y teclado. Desvíos del documento: el grupo con la etiqueta oculta es `<fieldset aria-label>` y no `<div role="group">`, porque oxlint (`prefer-tag-over-role`) rechaza `role="group"`; el botón de borrar dibuja el icono a 20 px y no a 18, porque `IconButton` no tiene tamaño de icono (pendiente de decidir con el usuario). Decisiones fuera del documento: `SegmentedControl<V extends string>` tipa `onChange` para que la migración pase `Need` sin conversión; de 2 a 4 opciones no se exige por tipo, porque rompería las opciones montadas con `.map()`; `onChange` solo salta al elegir otra opción; el segmento ocupado lleva `aria-busy` y sigue enfocable; los colores de desactivado que la tabla no da salen del tablero. `SearchField`: borde de 2 px hecho con 1 px de borde y 1 px de anillo interior, para que el texto no se mueva; el error mantiene el borde rojo con el foco; `busy` no pone `aria-busy` («igual que normal»); `autoComplete="off"` como hoy; la ayuda sigue visible desactivado. Escape con texto llama a `preventDefault` pero no para la propagación: dentro de una `Card` con `onEscape` también la cerraría, así que se revisa en T7. 84 tests nuevos; `pnpm check:task` en verde (1256 tests en web, floor guard limpio).
- 2026-11-10: revisión del usuario de la fase 1 en `/dev/components`. `IconButton` gana `iconSize` opcional y el botón de borrar de `SearchField` dibuja la cruz a 18 px, como el documento. El anillo de foco de ese botón salía por fuera del borde de la caja: `focus-ring` lee `--focus-ring-offset` (2 px por defecto) y `SearchField` lo pone a -4 px en el botón de borrar, así el anillo queda dentro del botón y de la caja. 3 tests nuevos (1259 en web).
- 2026-11-10: segunda revisión del usuario: el fondo de hover del botón de borrar tapaba el borde de la caja. `IconButton` gana `size="sm"` (40 px dibujado, 44 de área táctil con `::after`, como `Button` `sm`) y el botón de borrar lo usa a 4 px del borde derecho, así el hover y el anillo de foco quedan dentro de la caja. El usuario descarta usar la cruz del navegador (Firefox no la tiene y no se alcanza con Tab).
