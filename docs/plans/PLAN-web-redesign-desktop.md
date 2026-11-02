# Plan: web-redesign-desktop

- Created: 2026-11-02
- Status: **approved** (2026-11-02)
- Spec: [SPEC-web-redesign-desktop.md](../specs/SPEC-web-redesign-desktop.md)

## Overview

Componer la pantalla de escritorio (≥ 768 px): cabecera con indicador de actualización, panel lateral de 420 px con la lista siempre visible y la fila elegida marcada, tarjeta de estación sobre el mapa, aviso de ubicación con «Usar mi ubicación», favoritas plegables, leyenda y controles del mapa. Por debajo de 768 px la página sigue como hoy.

## Decisiones de implementación

- **Rama `feat/web-redesign-desktop`, un PR y un commit por tarea.** Sin `Co-Authored-By`. El PR toca `web/` y `docs/`. Título `feat(web): lay out the desktop screen of the redesign`: publica una release de la web.
- **Primero el esqueleto (T2).** `MapPage` elige la composición por breakpoint y `DesktopMapPage` monta cabecera, panel y mapa con lo que ya existe. Cada tarea siguiente añade una pieza a esa composición, así que la app funciona tras cada commit.
- **El móvil no se toca.** Los tests de hoy de `MapPage` corren por debajo de `md` (el *stub* de `matchMedia` ya lo permite) y deben pasar sin cambios. Los de escritorio van en archivos nuevos.
- **`UpdatedAt` se queda** para el móvil; `UpdatedIndicator` es una pieza nueva en `shared/ui/data-freshness` que reutiliza `RelativeTime`.
- **Los controles del mapa necesitan el `Map` de MapLibre**, que solo tiene `BaseMap`. `BaseMap` gana `onRecenter?` y pinta `MapControls` cuando lo recibe; acercar y alejar los resuelve por dentro.
- **Foco.** Abrir la tarjeta no mueve el foco; cerrarla lo devuelve a la fila con el `data-station-number` que ya usa `useListFocusReturn`.

## Grafo de dependencias

```
T1 UpdatedIndicator + iconos
   │
   └─► T2 composición de escritorio (cabecera, panel 420 px, lista fija)
          │
          ├─► T3 fila seleccionada y sincronía lista ↔ mapa
          │      │
          │      └─► T4 tarjeta de estación (cerrar, Escape, foco)
          │
          ├─► T5 aviso de ubicación y «Cerca de ti»
          │
          ├─► T6 favoritas plegables y leyenda
          │
          └─► T7 controles del mapa
                 │
                 └─► T8 cierre: axe de la página y orden de Tab
```

## Task List

### Fase 1: Esqueleto

- [x] **T1: `UpdatedIndicator` e iconos** (S, ~1 h)
  - Descripción: iconos nuevos en `shared/ui/icons` (ubicación, estrella, flecha, más, menos, cerrar, actualizar). `UpdatedIndicator({ status, updatedAt, onRetry })` en `shared/ui/data-freshness`: punto `aria-hidden` del color del estado y texto siempre presente («Actualizado hace N s», «Datos de hace N min», «Sin datos del servicio», «Desconectado»), con botón «Actualizar» en `ok` y «Reintentar» en el resto, con `aria-busy` mientras pide. En `loading` muestra «Cargando…» sin botón.
  - Aceptación:
    - Los cuatro estados y `loading` con su texto y su botón (SC3).
    - El botón llama a `onRetry` y queda `aria-busy` hasta que termina.
    - axe sin infracciones; iconos con `aria-hidden` y trazo de 2 px.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui`.
  - Archivos: `shared/ui/icons/*`, `shared/ui/data-freshness/{UpdatedIndicator.tsx,UpdatedIndicator.test.tsx,index.ts}`, `shared/ui/index.ts`.
  - Dependencias: ninguna.

- [ ] **T2: Composición de escritorio** (M, ~1 h 30 min)
  - Descripción: `MapPage` elige con `useMediaQuery(MD_MEDIA_QUERY)` entre la composición de hoy y `DesktopMapPage`. `widgets/app-header`: `h1` «Mad Transit», «BiciMAD en tiempo real» y `UpdatedIndicator` con el estado de `useAllStations` (`useDataStatus`). `SidePanel` pasa a 420 px. En escritorio el panel muestra siempre buscador → selector en tarjetas → `StationList` (sin detalle en el panel ni `LocateButton` suelto) y el mapa lleva `aria-label="Mapa de estaciones"`.
  - Aceptación:
    - Desde `md`: cabecera, panel de 420 px y mapa sin solaparse (SC1).
    - Con una estación elegida la lista sigue visible.
    - Por debajo de `md`, los tests de hoy de `MapPage` pasan sin cambios.
  - Verificación: `pnpm --filter web exec vitest run src/pages src/widgets`.
  - Archivos: `pages/map/ui/{MapPage.tsx,DesktopMapPage.tsx,DesktopMapPage.test.tsx}`, `widgets/app-header/*`, `shared/ui/side-panel/SidePanel.tsx`.
  - Dependencias: T1.

- [ ] **T3: Fila seleccionada y sincronía** (M, ~1 h)
  - Descripción: `StationRow` gana `selected` (`bg-primary-soft`, borde de 2 px `primary`, `aria-current="true"`) y su *hover* deja `bg-chip`. `StationRows` marca la de `?station` (sin distinguir mayúsculas). En escritorio, elegir en lista o mapa actualiza `?station`, marca la fila y centra el mapa dejando libre la esquina de la tarjeta (`focusPadding` derecho de 352 px).
  - Aceptación:
    - Elegir en la lista y en el mapa marca la misma fila (SC2).
    - Solo una fila con `aria-current`.
    - axe sin infracciones en la fila seleccionada.
  - Verificación: `pnpm --filter web exec vitest run src/entities src/widgets/station-list src/pages`.
  - Archivos: `entities/station/ui/{StationRow.tsx,StationRow.test.tsx}`, `widgets/station-list/ui/{StationRows.tsx,StationList.tsx}`, `shared/ui/base-map/*` si `focusPadding` necesita `right`, `pages/map/*`.
  - Dependencias: T2.

### Checkpoint: Fase 1

- [ ] `pnpm check:task` en verde, salvo avisos de aserciones reescritas explicados.
- [ ] `dev:mock` desde 768 px: cabecera, panel ancho, lista fija y fila marcada al elegir.

### Fase 2: Piezas del escritorio

- [ ] **T4: Tarjeta de estación** (M, ~1 h 30 min)
  - Descripción: `widgets/station-card`: 320 px arriba a la derecha del mapa, `rounded-card` y `shadow-float`. «Estación 33 · 57 m» (sin distancia, solo el número), nombre como encabezado, `FavoriteButton` y dos `AvailabilityBadge` no decorativas (bicis disponibles, anclajes libres) con el estado de `useStationDetail`. Botón «Cerrar» y Escape con el foco dentro: quitan `?station` y devuelven el foco a la fila. «No encontrada» y error muestran su mensaje con «Cerrar».
  - Aceptación:
    - La tarjeta muestra los datos de la estación elegida y cambia con el modo (SC2).
    - «Cerrar» y Escape quitan `?station` y el foco vuelve a la fila.
    - Abrir no mueve el foco.
    - axe sin infracciones en los estados normal, sin confirmar y no encontrada.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-card src/pages`.
  - Archivos: `widgets/station-card/*`, `pages/map/ui/DesktopMapPage.tsx`, `pages/map/model/useListFocusReturn.ts` si hace falta.
  - Dependencias: T3.

- [ ] **T5: Aviso de ubicación y «Cerca de ti»** (S, ~45 min)
  - Descripción: en escritorio, `StatusBanner` `info` con `LocationIcon`: sin ubicación, «Mostrando estaciones cerca de la Puerta del Sol porque no tenemos tu ubicación.» con la acción «Usar mi ubicación» (`location.locate`); con ubicación, «Usando tu ubicación actual.»; denegado, «No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol» sin acción. Título de la lista «Cerca de ti» o «Cerca de la Puerta del Sol» con «Ordenadas por distancia». El móvil mantiene sus textos.
  - Aceptación:
    - Los tres casos del aviso y los dos títulos (SC4).
    - «Usar mi ubicación» pide la posición.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-list src/pages`.
  - Archivos: `widgets/station-list/ui/{StationList.tsx,StationList.test.tsx}`, `pages/map/ui/DesktopMapPage.tsx`.
  - Dependencias: T2.

- [ ] **T6: Favoritas plegables y leyenda** (M, ~1 h 15 min)
  - Descripción: `shared/ui/collapsible-section`: cabecera como `<button>` con `aria-expanded` y `aria-controls`, icono, título, contador y flecha que gira; estado en `localStorage` (`bicimad-now:favorites-open`, abierta por defecto) con `useLocalStorage`. `FavoriteStations` la usa en escritorio con «Favoritas · N». `AvailabilityLegend` al pie del panel: «5 o más», «1 a 4», «Vacía», «Fuera de servicio» y «Sin confirmar» con su muestra (borde discontinuo en «Vacía»), como `<ul>` con encabezado oculto «Leyenda».
  - Aceptación:
    - Plegar oculta la lista, cambia `aria-expanded` y el estado sobrevive a recargar (SC5).
    - La leyenda lista los cinco niveles con sus muestras.
    - axe sin infracciones en las dos.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui src/widgets/station-list`.
  - Archivos: `shared/ui/collapsible-section/*`, `shared/config/constants.ts` (clave), `widgets/station-list/ui/{FavoriteStations.tsx,AvailabilityLegend.tsx}` y tests, `pages/map/ui/DesktopMapPage.tsx`.
  - Dependencias: T2.

- [ ] **T7: Controles del mapa** (S, ~1 h)
  - Descripción: `shared/ui/base-map/MapControls.tsx`, abajo a la derecha: «Acercar», «Alejar» y «Centrar en mi posición», botones de 44 px apilados con icono y `aria-label`. `BaseMap` lo pinta si recibe `onRecenter`; acercar y alejar llaman a `zoomIn` y `zoomOut` del mapa. En escritorio, `onRecenter` es `locate`.
  - Aceptación:
    - Cada botón llama a lo suyo; el zoom respeta 12–18 (lo hace MapLibre) (SC6).
    - Sin `onRecenter` no hay controles (móvil igual que hoy).
    - axe sin infracciones.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map src/pages`.
  - Archivos: `shared/ui/base-map/{MapControls.tsx,MapControls.test.tsx,BaseMap.tsx,BaseMap.test.tsx}`, `widgets/stations-map/ui/StationsMap.tsx`, `pages/map/ui/DesktopMapPage.tsx`.
  - Dependencias: T2.

### Checkpoint: Fase 2

- [ ] `pnpm check:task` en verde, salvo avisos explicados.
- [ ] `dev:mock` desde 768 px: tarjeta, aviso, favoritas, leyenda y controles.

### Fase 3: Cierre

- [ ] **T8: Accesibilidad de la página y cierre** (S, ~45 min)
  - Descripción: test de axe de `DesktopMapPage` con una estación elegida. Test del orden de Tab: buscador → selector → aviso → favoritas → lista → mapa → tarjeta. Revisar que el móvil no cambia. Changelog del plan.
  - Aceptación:
    - axe sin infracciones en la página de escritorio (SC7).
    - El orden de Tab es el de la spec.
    - SC8: `pnpm check:task`.
  - Verificación: `pnpm check:task`; recorrido manual en `dev:mock`.
  - Archivos: `pages/map/ui/DesktopMapPage.test.tsx`, este plan.
  - Dependencias: T4-T7.

### Checkpoint final

- [ ] SC1-SC8 comprobados; CI en verde.
- [ ] Pedir permiso antes de push, abrir el PR y hacer merge.
- [ ] Después del despliegue: comprobar en Render en escritorio; marcar spec, plan y capability map como **implemented**.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Dos composiciones en `MapPage` duplican lógica de página | Medio | Los *hooks* de `pages/map/model` son comunes; solo cambia el JSX |
| La tarjeta tapa la estación elegida en el mapa | Medio | `focusPadding` derecho al centrar (T3) |
| Tests de móvil afectados por el cambio de `MapPage` | Medio | Se ejecutan por debajo de `md` y no deben cambiar; los de escritorio van aparte |
| `zoomIn`/`zoomOut` no se pueden probar sin MapLibre real | Bajo | El *mock* de `Map` de `BaseMap.test.tsx` registra las llamadas |

## Paralelización

T5, T6 y T7 solo dependen de T2 y no comparten archivos salvo `DesktopMapPage.tsx`; se hacen en serie para evitar conflictos en ese archivo.

## Estimación

Unas 9 h en total. Fase 1 ~3 h 30 min, fase 2 ~4 h 30 min y fase 3 ~45 min.

## Changelog

- 2026-11-02: borrador a partir de la spec aprobada.
- 2026-11-02: aprobado por el usuario.
- 2026-11-02: T1 hecha. `CloseIcon` es un alias de `ClearIcon` (la misma x); `StarIcon` se rellena con `fill-current` sin cambios. `UpdatedIndicator` declara su propia unión de estados porque `shared` no importa `entities`; punto con `availability-good`, `-low`, `-empty-line` y `-off`, como en la spec; `aria-busy` solo si `onRetry` devuelve una promesa, hasta que se resuelve o falla. Sin hora conocida dice «Actualizado» o «Datos sin confirmar», como `StaleNotice`. 17 tests nuevos (590 en web) y `check:task` en verde.
