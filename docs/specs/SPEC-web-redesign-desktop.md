# Spec: web-redesign-desktop

- Created: 2026-11-02
- Status: **approved** (2026-11-02)
- Plan: [PLAN-web-redesign-desktop.md](../plans/PLAN-web-redesign-desktop.md)

Módulo `web-redesign-desktop` del [Capability Map](CAPABILITY-MAP.md), el cuarto del rediseño de la UI. Es la fase 4 («Pantalla de escritorio») del documento «Mad Transit — Especificación de UI» (revisión 32) y la pantalla de escritorio del lienzo «Mad Transit · rediseño», que son privados, más las piezas nuevas de la fase 3 que solo se usan aquí. Compone la pantalla a partir de 768 px con las piezas de [web-redesign-components](SPEC-web-redesign-components.md).

## Objective

Que en escritorio la lista y el mapa estén siempre a la vista y sincronizados, con la estación elegida en una tarjeta sobre el mapa.

- Como usuario, elijo una estación en la lista o en el mapa y veo su tarjeta sin perder la lista; la fila queda marcada.
- Como usuario, veo en la cabecera si los datos están al día y puedo actualizarlos.
- Como usuario sin ubicación, el aviso me ofrece «Usar mi ubicación»; con ubicación, el título pasa a «Cerca de ti».
- Como usuario, pliego mis favoritas y la app lo recuerda; al pie tengo la leyenda de colores.
- Como usuario de teclado, recorro buscador → modo → aviso → lista → mapa y cierro la tarjeta con Escape.

**Fuera de alcance:** la pantalla móvil (< 768 px), que sigue como hoy con las piezas nuevas hasta `web-redesign-mobile`; los textos y pantallas de error del diseño en el panel y el mapa (`web-error-states`); el selector BiciMAD / Bus (`web-bus`); el botón de ruta, que el diseño quita.

## Decisiones (2026-11-02, del usuario)

1. **Indicador de la cabecera con sus cuatro estados**, del estado de la lista completa: verde «Actualizado hace N s» con botón «Actualizar»; ámbar «Datos de hace N min», rojo «Sin datos del servicio» y gris «Desconectado», con «Reintentar».
2. **Tarjeta de estación con insignias.** Bicis y anclajes libres reutilizan `AvailabilityBadge` (color, etiqueta y gris «Sin confirmar»).
3. **La tarjeta se cierra** con un botón «Cerrar» y con Escape cuando el foco está dentro; quita `?station`.
4. **Permiso denegado:** «No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol», sin botón (el navegador no vuelve a preguntar).
5. **De `web-redesign-components`:** la tarjeta lleva número, distancia, nombre, bicis, anclajes libres y la estrella de favorita; el buscador sigue siendo el desplegable por número.

## Assumptions

1. **Dos composiciones.** `MapPage` elige con `useMediaQuery(MD_MEDIA_QUERY)`: desde `md`, la de este módulo; por debajo, la de hoy (bottom sheet con el detalle en el panel). El estado compartido (`?need`, `?station`, la búsqueda) no cambia.
2. **Cabecera** (`widgets/app-header`, 64 px, a todo el ancho sobre panel y mapa): «Mad Transit» como `h1` visible y «BiciMAD en tiempo real» debajo; a la derecha, `UpdatedIndicator` (`shared/ui/data-freshness`, evoluciona `UpdatedAt`): punto `aria-hidden` del color del estado, texto siempre presente y botón. «Reintentar» pide en el acto con `aria-busy` mientras pide. Lee el estado de `useAllStations` con `useDataStatus`.
3. **Panel lateral de 420 px** (`SidePanel`, hoy 360): buscador → selector en tarjetas → aviso de ubicación → favoritas → «Cerca de la Puerta del Sol» o «Cerca de ti», con «Ordenadas por distancia» → lista → leyenda → atribución de datos. La lista ya no se sustituye por el detalle en escritorio.
4. **Aviso de ubicación** (`StatusBanner` `info`): sin ubicación, «Mostrando estaciones cerca de la Puerta del Sol porque no tenemos tu ubicación.» con la acción «Usar mi ubicación» (pide la posición, como `LocateButton`); con ubicación, «Usando tu ubicación actual.» sin acción; con permiso denegado, el texto de la decisión 4 sin acción. El icono pasa a un marcador de posición (`LocationIcon`), como el lienzo. `LocateButton` deja de estar en el panel de escritorio.
5. **Fila seleccionada.** `StationRow` gana `selected`: fondo `primary-soft`, borde de 2 px `primary` y `aria-current="true"`. El *hover* deja de usar `bg-chip` para no confundirse con el chip del número.
6. **Tarjeta de estación** (`widgets/station-card`, 320 px, arriba a la derecha del mapa, `shadow-float`, `rounded-card`): «Estación 33 · 57 m» (sin distancia, solo el número), nombre como encabezado, estrella de favorita (`FavoriteButton`) y dos insignias no decorativas: bicis disponibles y anclajes libres. Datos: los de `useStationDetail` (mismo estado, caché y «no encontrada»); la distancia, de `useStationDistance`. Al abrirse no roba el foco; «Cerrar» y Escape devuelven el foco a la fila de la que se abrió (`useListFocusReturn`). En «no encontrada» y en error, la tarjeta muestra el mensaje y «Cerrar».
7. **Favoritas plegables** (`shared/ui/collapsible-section`): botón de cabecera con estrella, «Favoritas · N» y flecha, `aria-expanded` y `aria-controls`. Abierta por defecto; guarda el estado en `localStorage` (`bicimad-now:favorites-open`, preferencia de UI que la regla ya permite).
8. **Leyenda** (`widgets/station-list/ui/AvailabilityLegend`): «5 o más», «1 a 4», «Vacía», «Fuera de servicio» y «Sin confirmar», cada una con su muestra de color y el borde discontinuo en «Vacía». Lista (`<ul>`), no tabla, con encabezado oculto «Leyenda».
9. **Controles del mapa** (`shared/ui/base-map/MapControls`, abajo a la derecha, botones de 44 px apilados): «Acercar», «Alejar» y «Centrar en mi posición». Los dos primeros llaman a `zoomIn`/`zoomOut` de MapLibre (respetan los límites 12–18); el tercero hace lo de `LocateButton`. Iconos SVG con `aria-label`.
10. **Mapa.** El contenedor tiene `aria-label="Mapa de estaciones"`. Al seleccionar una estación fuera de la vista, el mapa la centra dejando libre la tarjeta (`focusPadding` a la derecha). Seleccionar en el mapa marca la fila y abre la tarjeta.

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

Manual en `dev:mock` desde 768 px: elegir en lista y mapa, cerrar con el botón y con Escape, plegar favoritas y recargar, «Usar mi ubicación», acercar y alejar, y Tab en orden buscador → modo → aviso → favoritas → lista → mapa → tarjeta.

## Project Structure

```
web/src/
  pages/map/ui/MapPage.tsx                     composición de escritorio o la de hoy, por breakpoint
  pages/map/ui/DesktopMapPage.tsx              cabecera, panel, mapa, tarjeta y controles
  widgets/app-header/                          marca + UpdatedIndicator
  widgets/station-card/                        tarjeta sobre el mapa
  widgets/station-list/ui/                     títulos «Cerca de…», favoritas plegables, leyenda, fila seleccionada
  shared/ui/data-freshness/UpdatedIndicator.tsx  cuatro estados, evoluciona UpdatedAt
  shared/ui/collapsible-section/               sección plegable con preferencia guardada
  shared/ui/base-map/MapControls.tsx           acercar, alejar, centrar
  shared/ui/icons/                             + LocationIcon, StarIcon, ChevronIcon, PlusIcon, MinusIcon, CloseIcon, RefreshIcon
  shared/ui/side-panel/SidePanel.tsx           420 px
  entities/station/ui/StationRow.tsx           + selected
```

## Code Style

El de [web-redesign-components](SPEC-web-redesign-components.md#code-style): cada pieza nueva con su test de `expectNoAxeViolations`, clases enteras en mapas con `satisfies`, textos en español.

```tsx
const INDICATOR = {
  ok: { dot: 'bg-availability-good', action: 'Actualizar' },
  stale: { dot: 'bg-availability-low', action: 'Reintentar' },
  error: { dot: 'bg-availability-empty-line', action: 'Reintentar' },
  offline: { dot: 'bg-availability-off', action: 'Reintentar' },
} as const satisfies Record<Exclude<DataStatus, 'loading'>, { dot: string; action: string }>;
```

## Testing Strategy

- Vitest, Testing Library y MSW, como hoy; axe en cada pieza nueva y en la página de escritorio.
- `UpdatedIndicator`: texto y botón de los cuatro estados; «Reintentar» pide en el acto con `aria-busy`.
- Página: elegir en la lista abre la tarjeta y marca la fila (`aria-current`); elegir en el mapa, igual; «Cerrar» y Escape quitan `?station` y devuelven el foco a la fila; cambiar de modo cambia lista, mapa y tarjeta.
- Aviso de ubicación: los tres casos (sin ubicación con acción, con ubicación, denegado) y el título «Cerca de ti».
- Favoritas: plegar oculta la lista, `aria-expanded` cambia y el estado sobrevive a recargar.
- `MapControls`: llama a `zoomIn`, `zoomOut` y a localizar.
- Por debajo de `md`, la composición de hoy no cambia (los tests de hoy siguen pasando).
- Cobertura ≥ 80 % por capa; `pnpm --filter web depcruise` sin violaciones.

## Boundaries

- **Siempre:** reutilizar las piezas de `web-redesign-components`; `<button>` nativo; foco visible; no mover el foco sin acción del usuario.
- **Preguntar antes:** cualquier dependencia; cambiar la URL; tocar la composición móvil más allá de lo que comparten las piezas.
- **Nunca:** marcadores como botones del DOM; textos de error del diseño (son de `web-error-states`); hex fuera de `index.css`.

## Success Criteria

1. SC1: desde 768 px se ven cabecera, panel de 420 px, mapa y, con una estación elegida, la tarjeta; panel y mapa no se solapan.
2. SC2: elegir en lista o mapa marca la fila, abre la tarjeta y centra el mapa si hace falta; «Cerrar» y Escape la quitan y devuelven el foco.
3. SC3: el indicador muestra los cuatro estados con su texto y su botón.
4. SC4: el aviso de ubicación cubre sin ubicación (con «Usar mi ubicación»), con ubicación («Cerca de ti») y denegado.
5. SC5: favoritas plegables que recuerdan su estado; leyenda con los cinco niveles.
6. SC6: «Acercar», «Alejar» y «Centrar en mi posición» funcionan dentro de los límites de zoom.
7. SC7: axe sin infracciones en la página de escritorio; por debajo de 768 px nada cambia.
8. SC8: `pnpm check:task` pasa.

## Open Questions

Ninguna.

## Changelog

- 2026-11-02: borrador a partir del documento de diseño (revisión 32) y del lienzo, con las decisiones 1 a 4 del usuario.
- 2026-11-02: aprobada por el usuario.
