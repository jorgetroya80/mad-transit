# Spec: web-redesign-mobile

- Created: 2026-11-03
- Status: **approved** (2026-11-03)
- Plan: [PLAN-web-redesign-mobile.md](../plans/PLAN-web-redesign-mobile.md)

Módulo `web-redesign-mobile` del [Capability Map](CAPABILITY-MAP.md), el quinto del rediseño de la UI. Es la fase 5 («Pantalla móvil») del documento «Mad Transit — Especificación de UI» (revisión 32) y las pantallas «Móvil — interactivo» y «Móvil — estación elegida» del lienzo «Mad Transit · rediseño», que son privados. Compone la pantalla por debajo de 768 px con las piezas de [web-redesign-components](SPEC-web-redesign-components.md) y las de [web-redesign-desktop](SPEC-web-redesign-desktop.md).

## Objective

Que en el móvil el mapa ocupe la pantalla y la lista viva en un panel inferior de tres alturas que se maneja con toques.

- Como usuario, veo el mapa entero con el buscador y el modo flotando arriba, y abro o cierro la lista sin perder el mapa.
- Como usuario, la cabecera del panel me dice cuántas estaciones cercanas tienen bicis (o hueco) y cuándo se actualizaron.
- Como usuario, elijo una estación en el mapa o en la lista y el panel muestra su detalle (bicis, anclajes libres y estrella); al cerrarlo vuelvo a la lista donde estaba.
- Como usuario sin ubicación, el aviso me ofrece «Activar»; con ubicación, el subtítulo pasa a «Cerca de ti».
- Como usuario de teclado o lector de pantalla, recorro buscador → modo → centrar → asa → aviso → favoritas → lista → mapa, cierro el detalle con Escape y cada control dice qué hace.
- Como usuario con «reducir movimiento», el panel cambia de altura sin animación.

**Fuera de alcance:** el arrastre del panel (`web-sheet-drag`); los textos y pantallas de error del diseño (`web-error-states`); el selector BiciMAD / Bus del lienzo (`web-bus`); la leyenda de colores, que el diseño móvil no lleva; los textos nuevos del detalle para «no encontrada», «error de carga» y «fuera de servicio» del tablero, que llegan con `web-error-states` a las dos pantallas a la vez (aquí el detalle muestra los estados que ya tiene la tarjeta de escritorio).

## Decisiones (2026-11-03, del usuario)

1. **El detalle vive dentro del panel**, en lugar de la lista, según el tablero «Móvil — estación elegida» del diseñador: mismas piezas que la tarjeta de escritorio (meta, nombre, estrella, bicis y anclajes libres). Una tarjeta flotante taparía el mapa a 390 px.
2. **Aviso de ubicación compacto**, el del lienzo: «Sin tu ubicación: cerca de la Puerta del Sol» con el botón «Activar».
3. **Sin leyenda** en el móvil, como el lienzo; cada insignia ya lleva su etiqueta.
4. **Alturas con el detalle abierto:** al abrirlo, el panel pasa a `half` desde cualquier altura y guarda la que tenía la lista; el asa alterna `half ↔ hidden` (decisión 8). Al cerrar, el panel vuelve a la altura guardada.
5. **Volver a la lista** (flecha a la izquierda de la cabecera, como en Bus móvil, o Escape con el foco dentro) quita `?station`, como en escritorio, y devuelve el foco a la fila de la estación o, si se abrió desde el mapa, la búsqueda o un enlace, al primer encabezado de la lista.
6. **El foco solo se mueve si se perdería** (2026-11-03, tras T4): abrir el detalle desde una fila de la lista (la fila desaparece) lleva el foco al nombre de la estación (`h2` con `tabIndex={-1}`); abrirlo desde el mapa, la búsqueda o un enlace no lo mueve. Volver a una lista en `hidden` (cuerpo `inert`) lleva el foco a la franja «Mostrar lista · …»; en `half`, a la fila, como en la decisión 5.
7. **Buscador de 44 px, 44 px por debajo del borde** (2026-11-03, tras la revisión): la atribución de OpenFreeMap / OpenMapTiles / OpenStreetMap va arriba a la derecha en el móvil y el buscador de 50 px del lienzo la tapaba. El buscador baja a 44 px de alto y los controles flotantes empiezan a 44 px del borde, 10 px por debajo del «ⓘ». `half` nunca pasa de `100dvh − 166px`, para no tapar buscador y modo en pantallas bajas.
8. **Dos alturas: `hidden` y `half`** (2026-11-03, tableros «Móvil — panel oculto», «Móvil — interactivo» y «Móvil — estación elegida» del diseñador): desaparecen `peek` (112 px), `full` y el botón «Ver todas / Ver mapa». `hidden` mide 56 px y no muestra cabecera ni cuerpo: toda la franja es un `<button>` con la barra y un texto visible que es su nombre accesible, «Mostrar lista · N estaciones con bicis» (o «con hueco») con la lista y «Mostrar detalle · Puerta del Sol» con una estación elegida («Mostrar detalle · Estación no encontrada» si no existe; mientras carga o con error, el número: «Mostrar detalle · Estación 33»), en una línea que se corta con puntos suspensivos si no cabe; al tocarla, el panel sube a `half`. En `half` la cabecera ocupa todo el ancho, la lista se desplaza dentro del panel y el asa (44 px de alto, todo el ancho) lleva a `hidden` con el nombre «Ocultar lista» u «Ocultar detalle». El botón de centrar ya no se oculta nunca: siempre 16 px por encima del panel (72 px del borde en `hidden`). Volver del detalle recupera la altura de antes, también `hidden`; el foco va entonces a la franja. Ver la lista en grande queda para el arrastre de `web-sheet-drag`.

## Assumptions

1. **Composición.** `MobileMapPage` deja de usar `AppLayout` y compone: mapa a pantalla completa, buscador y modo flotantes arriba, botón de centrar y `BottomSheet`. `AppLayout` y `widgets/app-layout` desaparecen si nadie más los usa. El `h1` «Mad Transit» sigue oculto visualmente.
2. **Buscador flotante** (`TransitSearch` con `variant="floating"`): 44 px de alto (decisión 7), a 44 px del borde superior, esquinas `rounded-full`, `shadow-float`, etiqueta «Buscar estación» oculta visualmente y la ayuda como `aria-describedby`, igual que hoy. El desplegable se abre sobre el mapa.
3. **Modo en píldora** (`NeedToggle variant="pill"`, ya existe) debajo del buscador, alineado a la derecha, con fondo `surface` y `shadow-float`.
4. **`BottomSheet` con dos alturas** (`snap: 'hidden' | 'half'`, controlado por la página; decisión 8):
   - `hidden` 56 px: solo la franja «Mostrar lista · …» o «Mostrar detalle · …» (decisión 8); cabecera y cuerpo quedan `inert` y ocultos.
   - `half` (inicial): `min(430px, 100dvh − 166px)`; asa, cabecera, aviso y la lista con la quinta fila cortada, que se desplaza dentro del panel.
   - El panel anima su altura con `duration-320 ease-sheet` y `motion-reduce:transition-none`. Las alturas viven en `sheetSize.ts`, de donde también lee el mapa.
5. **Asa y franja** (decisión 8): en `half`, el asa es un `<button>` de 44 px a todo el ancho con la barra `aria-hidden`, `aria-label` «Ocultar lista» u «Ocultar detalle», `aria-expanded` verdadero y `aria-controls` al cuerpo; lleva a `hidden`. En `hidden`, la franja es un `<button>` con nombre por su texto visible, `aria-expanded` falso y `aria-controls` al cuerpo; lleva a `half`.
6. **Cabecera del panel:** `h2` «N estaciones con bicis» o «N estaciones con hueco», donde N es el número de estaciones cercanas con al menos una bici (o un anclaje libre) en el modo actual; subtítulo «Cerca de la Puerta del Sol · hace 30 s» o «Cerca de ti · hace 30 s», con la antigüedad de `useDataStatus`. Ocupa todo el ancho, sin «Ver todas / Ver mapa» (decisión 8).
7. **Aviso de ubicación** (`StatusBanner` `info`, variante compacta): sin ubicación, «Sin tu ubicación: cerca de la Puerta del Sol» con la acción «Activar» (pide la posición, con `aria-busy` mientras pide); con ubicación, «Usando tu ubicación actual.» sin acción; con permiso denegado, el texto de escritorio sin acción.
8. **Lista del panel:** aviso → favoritas plegables (`CollapsibleSection`, misma preferencia guardada que escritorio) → `h3` «Cercanas» → filas. Sin «Ordenadas por distancia» ni leyenda. Al pie, la atribución de datos.
9. **Botón de centrar** (48 px, redondo, `shadow-float`, `aria-label` «Centrar en mi posición»): a la derecha, 16 px por encima del panel, y se mueve con la misma curva; no se oculta nunca (decisión 8). Hace lo de hoy (`locate` de `useUserFocus`) y, como en escritorio, no aparece con el permiso de ubicación denegado. `LocateButton` sale del panel móvil y se borra.
10. **Elegir una estación** (mapa, lista, búsqueda o enlace con `?station`): el panel muestra el detalle (decisiones 1 y 4), con `aria-label` «Detalle de la estación» en lugar de «Estaciones cercanas», y el punto del mapa queda grande y con anillo. Abrir el detalle no mueve el foco. El mapa centra la estación si queda fuera de la vista, dejando libre la altura actual del panel (`focusPadding.bottom`). Elegir otra estación con el detalle abierto lo sustituye sin tocar la altura guardada.
11. **Detalle en el panel** (`StationSheetHeader` en la cabecera del panel y `StationSheetBody` en su cuerpo, de `widgets/station-card`, porque la cabecera y el cuerpo se ocultan juntos en `hidden` pero el panel decide qué va en cada ranura): fila de cabecera con, en este orden, el botón de flecha «Volver a la lista» (`aria-label`, 44 px, color `primary`), «Estación 33 · 57 m» con el nombre como `h2`, y la estrella («Favorita», `aria-pressed`, 44 px) a la derecha. No hay «Cerrar». En `hidden` solo se ve la franja «Mostrar detalle · …». Debajo, las dos insignias de la tarjeta de escritorio, con el gris «Sin confirmar», al pie «Actualizado hace N s» con la antigüedad del detalle y la atribución de datos de la EMT. Datos, estados «no encontrada» y error y retorno del foco: los de la tarjeta de escritorio (`useStationDetail`, `useStationDistance`, `useListFocusReturn`).
12. **Se retira el detalle de hoy:** `widgets/station-detail` y `features/locate-user` se borran con sus tests y `MapPanel` pasa a `MobilePanel`, solo con la lista; `usePanelExpanded` pasa a `useSheetSnap`, que gobierna la altura y la guardada.
13. **Mapa.** Ocupa toda la pantalla bajo el panel; la franja de `hidden` (56 px) queda fuera del mapa. La atribución del mapa sigue arriba a la derecha, como fijó `web-shell`, libre de los controles flotantes (decisión 7). El contenedor mantiene `aria-label="Mapa de estaciones"`. Sin `MapControls` de acercar y alejar: en el móvil se usa el pellizco y el doble toque.

## Tech Stack

El de [web-redesign-components](SPEC-web-redesign-components.md#tech-stack). Sin dependencias nuevas.

## Commands

```bash
pnpm --filter web dev:mock
pnpm --filter web test
pnpm --filter web test:coverage
pnpm --filter web depcruise
pnpm --filter web build
pnpm check:task
```

Manual en `dev:mock` por debajo de 768 px (DevTools, 390 × 844 y 375 × 667): alternar `half` y `hidden` con el asa y la franja, con y sin «reducir movimiento»; elegir en mapa y lista; «Activar»; centrar; plegar favoritas; Tab en el orden del objetivo. La geolocalización real, en Render tras el merge.

## Project Structure

```
web/src/
  pages/map/ui/MobileMapPage.tsx              mapa, controles flotantes, botón de centrar y panel
  pages/map/ui/MobileSheet.tsx                panel: cabecera y cuerpo de la lista o del detalle
  pages/map/ui/MobileSheetHeader.tsx          «N estaciones con…» y subtítulo
  pages/map/ui/MobilePanel.tsx                aviso, favoritas, «Cercanas», atribución (antes MapPanel)
  pages/map/ui/RecenterButton.tsx             botón de centrar que sigue al panel
  pages/map/model/useSheetSnap.ts             sustituye a usePanelExpanded: hidden / half, altura guardada al abrir el detalle
  pages/map/model/useMapFocusPadding.ts       padding inferior según la altura actual
  shared/ui/bottom-sheet/BottomSheet.tsx      dos alturas, asa en half y franja «Mostrar…» en hidden
  shared/ui/bottom-sheet/sheetSize.ts         alturas de hidden y half
  widgets/station-card/                       StationSheetHeader y StationSheetBody: detalle en el panel
  widgets/station-list/ui/                    variante móvil del aviso, encabezado «Cercanas», recuento para la cabecera
  widgets/transit-search/                     variante flotante
  widgets/station-detail/, features/locate-user/  se borran
  widgets/app-layout/                         se borra
```

## Code Style

El de [web-redesign-components](SPEC-web-redesign-components.md#code-style): cada pieza nueva con su test de `expectNoAxeViolations`, clases enteras en mapas con `satisfies`, textos en español.

```ts
export type SheetSnap = 'hidden' | 'half';

const OTHER_SNAP = { hidden: 'half', half: 'hidden' } as const satisfies Record<
  SheetSnap,
  SheetSnap
>;
```

## Testing Strategy

- Vitest, Testing Library y MSW, como hoy; axe en el panel en sus dos alturas y en la página móvil.
- `BottomSheet`: arranca en `half`; el asa lleva a `hidden` y la franja a `half`, con sus nombres y `aria-expanded`; en `hidden` cabecera y cuerpo son `inert`; la clase `motion-reduce:transition-none` está presente.
- Página: elegir en el mapa o la lista abre el detalle en `half` desde cualquier altura sin mover el foco; con el detalle, el asa y la franja alternan `half ↔ hidden`; «Volver a la lista» y Escape quitan `?station`, vuelven a la altura guardada y devuelven el foco a la fila; el botón de centrar está siempre y sigue al panel; el padding del mapa sigue a la altura.
- `StationSheetHeader` y `StationSheetBody`: «Volver a la lista», título y estrella en una fila, en ese orden de tabulación, sin «Cerrar»; pie «Actualizado hace N s»; los tests de escritorio no cambian.
- Cabecera: el recuento y «bicis» / «hueco» cambian con el modo; el subtítulo cambia con la ubicación.
- Aviso: los tres casos y «Activar» con `aria-busy`.
- Los tests de escritorio siguen pasando sin cambios.
- Cobertura ≥ 80 % por capa; `pnpm --filter web depcruise` sin violaciones.

## Boundaries

- **Siempre:** controles por toque para todo (WCAG 2.5.7); `<button>` nativo; foco visible; no mover el foco sin acción del usuario; objetivos ≥ 44 px salvo los puntos del mapa.
- **Preguntar antes:** cualquier dependencia; cambiar la URL; tocar la composición de escritorio más allá de lo que comparten las piezas.
- **Nunca:** gestos de arrastre (son de `web-sheet-drag`); textos de error del diseño (son de `web-error-states`); hex fuera de `index.css`.

## Success Criteria

1. SC1: por debajo de 768 px se ven mapa a pantalla completa, buscador flotante de 44 px que no tapa la atribución del mapa, modo en píldora, botón de centrar y el panel en `half` con la quinta fila cortada.
2. SC2: el asa y la franja alternan `half` y `hidden` según la decisión 8, sin «Ver todas / Ver mapa», con la animación de 320 ms, y sin animación con «reducir movimiento».
3. SC3: el botón de centrar acompaña al panel, siempre 16 px por encima.
4. SC4: la cabecera dice «N estaciones con bicis / hueco» y «Cerca de la Puerta del Sol / Cerca de ti · hace N s».
5. SC5: elegir en mapa o lista abre el detalle en el panel a `half`; el asa alterna `half ↔ hidden`; «Volver a la lista» y Escape vuelven a la lista a su altura anterior, sin estación marcada y con el foco en la fila.
6. SC6: el aviso de ubicación cubre sin ubicación («Activar»), con ubicación y denegado.
7. SC7: axe sin infracciones en la página móvil, en el panel en sus dos alturas y con el detalle abierto; desde 768 px nada cambia.
8. SC8: `pnpm check:task` pasa.

## Open Questions

Ninguna.

## Changelog

- 2026-11-03: borrador a partir del documento de diseño (revisión 32) y de la pantalla móvil del lienzo, con las decisiones 1 a 3 del usuario.
- 2026-11-03: decisión 1 cambiada según el tablero «Móvil — estación elegida» del diseñador: detalle dentro del panel; se añaden las decisiones 4 y 5.
- 2026-11-03: el diseñador alinea «Móvil — interactivo» y «Móvil — estación elegida» con Bus móvil: flecha «Volver a la lista» en lugar de «Cerrar», pie «Actualizado hace N s» y la pantalla arranca en la lista sin estación elegida.
- 2026-11-03: aprobada por el usuario.
- 2026-11-03: decisión 6 sobre el foco, tras ver en T4 que se perdía al abrir desde una fila y al volver a `peek`.
- 2026-11-03: revisión del código. Decisión 7 (buscador de 44 px, controles a 44 px del borde y `full` con 166 px libres) para no tapar la atribución del mapa; atribución EMT también con el detalle; el botón de centrar se oculta con el permiso denegado; la spec recoge cómo quedó el detalle (`StationSheetHeader` / `StationSheetBody`) y `MobilePanel`.
- 2026-11-03: decisión 8 según el tablero «Móvil — panel oculto» del diseñador: `hidden` de 56 px con franja «Mostrar lista · …» sustituye a `peek`.
- 2026-11-03: el diseñador quita «Ver todas / Ver mapa»; con ello desaparece `full` y el panel queda con `hidden` y `half` (decisión 8 reescrita; supuestos 4, 5, 6 y 9, pruebas y SC2, SC3 y SC7 ajustados).
