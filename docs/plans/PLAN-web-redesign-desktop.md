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

- [x] **T2: Composición de escritorio** (M, ~1 h 30 min)
  - Descripción: `MapPage` elige con `useMediaQuery(MD_MEDIA_QUERY)` entre la composición de hoy y `DesktopMapPage`. `widgets/app-header`: `h1` «Mad Transit», «BiciMAD en tiempo real» y `UpdatedIndicator` con el estado de `useAllStations` (`useDataStatus`). `SidePanel` pasa a 420 px. En escritorio el panel muestra siempre buscador → selector en tarjetas → `StationList` (sin detalle en el panel ni `LocateButton` suelto) y el mapa lleva `aria-label="Mapa de estaciones"`.
  - Aceptación:
    - Desde `md`: cabecera, panel de 420 px y mapa sin solaparse (SC1).
    - Con una estación elegida la lista sigue visible.
    - Por debajo de `md`, los tests de hoy de `MapPage` pasan sin cambios.
  - Verificación: `pnpm --filter web exec vitest run src/pages src/widgets`.
  - Archivos: `pages/map/ui/{MapPage.tsx,DesktopMapPage.tsx,DesktopMapPage.test.tsx}`, `widgets/app-header/*`, `shared/ui/side-panel/SidePanel.tsx`.
  - Dependencias: T1.

- [x] **T3: Fila seleccionada y sincronía** (M, ~1 h)
  - Descripción: `StationRow` gana `selected` (`bg-primary-soft`, borde de 2 px `primary`, `aria-current="true"`) y su *hover* deja `bg-chip`. `StationRows` marca la de `?station` (sin distinguir mayúsculas). En escritorio, elegir en lista o mapa actualiza `?station`, marca la fila y centra el mapa dejando libre la esquina de la tarjeta (`focusPadding` derecho de 352 px).
  - Aceptación:
    - Elegir en la lista y en el mapa marca la misma fila (SC2).
    - Solo una fila con `aria-current`.
    - axe sin infracciones en la fila seleccionada.
  - Verificación: `pnpm --filter web exec vitest run src/entities src/widgets/station-list src/pages`.
  - Archivos: `entities/station/ui/{StationRow.tsx,StationRow.test.tsx}`, `widgets/station-list/ui/{StationRows.tsx,StationList.tsx}`, `shared/ui/base-map/*` si `focusPadding` necesita `right`, `pages/map/*`.
  - Dependencias: T2.

### Checkpoint: Fase 1

- [x] `pnpm check:task` en verde, salvo avisos de aserciones reescritas explicados.
- [ ] `dev:mock` desde 768 px: cabecera, panel ancho, lista fija y fila marcada al elegir.

### Fase 2: Piezas del escritorio

- [x] **T4: Tarjeta de estación** (M, ~1 h 30 min)
  - Descripción: `widgets/station-card`: 320 px arriba a la derecha del mapa, `rounded-card` y `shadow-float`. «Estación 33 · 57 m» (sin distancia, solo el número), nombre como encabezado, `FavoriteButton` y dos `AvailabilityBadge` no decorativas (bicis disponibles, anclajes libres) con el estado de `useStationDetail`. Botón «Cerrar» y Escape con el foco dentro: quitan `?station` y devuelven el foco a la fila. «No encontrada» y error muestran su mensaje con «Cerrar».
  - Aceptación:
    - La tarjeta muestra los datos de la estación elegida y cambia con el modo (SC2).
    - «Cerrar» y Escape quitan `?station` y el foco vuelve a la fila.
    - Abrir no mueve el foco.
    - axe sin infracciones en los estados normal, sin confirmar y no encontrada.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-card src/pages`.
  - Archivos: `widgets/station-card/*`, `pages/map/ui/DesktopMapPage.tsx`, `pages/map/model/useListFocusReturn.ts` si hace falta.
  - Dependencias: T3.

- [x] **T5: Aviso de ubicación y «Cerca de ti»** (S, ~45 min)
  - Descripción: en escritorio, `StatusBanner` `info` con `LocationIcon`: sin ubicación, «Mostrando estaciones cerca de la Puerta del Sol porque no tenemos tu ubicación.» con la acción «Usar mi ubicación» (`location.locate`); con ubicación, «Usando tu ubicación actual.»; denegado, «No has dado permiso de ubicación: mostrando estaciones cerca de la Puerta del Sol» sin acción. Título de la lista «Cerca de ti» o «Cerca de la Puerta del Sol» con «Ordenadas por distancia». El móvil mantiene sus textos.
  - Aceptación:
    - Los tres casos del aviso y los dos títulos (SC4).
    - «Usar mi ubicación» pide la posición.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-list src/pages`.
  - Archivos: `widgets/station-list/ui/{StationList.tsx,StationList.test.tsx}`, `pages/map/ui/DesktopMapPage.tsx`.
  - Dependencias: T2.

- [x] **T6: Favoritas plegables y leyenda** (M, ~1 h 15 min)
  - Descripción: `shared/ui/collapsible-section`: cabecera como `<button>` con `aria-expanded` y `aria-controls`, icono, título, contador y flecha que gira; estado en `localStorage` (`bicimad-now:favorites-open`, abierta por defecto) con `useLocalStorage`. `FavoriteStations` la usa en escritorio con «Favoritas · N». `AvailabilityLegend` al pie del panel: «5 o más», «1 a 4», «Vacía», «Fuera de servicio» y «Sin confirmar» con su muestra (borde discontinuo en «Vacía»), como `<ul>` con encabezado oculto «Leyenda».
  - Aceptación:
    - Plegar oculta la lista, cambia `aria-expanded` y el estado sobrevive a recargar (SC5).
    - La leyenda lista los cinco niveles con sus muestras.
    - axe sin infracciones en las dos.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui src/widgets/station-list`.
  - Archivos: `shared/ui/collapsible-section/*`, `shared/config/constants.ts` (clave), `widgets/station-list/ui/{FavoriteStations.tsx,AvailabilityLegend.tsx}` y tests, `pages/map/ui/DesktopMapPage.tsx`.
  - Dependencias: T2.

- [x] **T7: Controles del mapa** (S, ~1 h)
  - Descripción: `shared/ui/base-map/MapControls.tsx`, abajo a la derecha: «Acercar», «Alejar» y «Centrar en mi posición», botones de 44 px apilados con icono y `aria-label`. `BaseMap` lo pinta si recibe `onRecenter`; acercar y alejar llaman a `zoomIn` y `zoomOut` del mapa. En escritorio, `onRecenter` es `locate`.
  - Aceptación:
    - Cada botón llama a lo suyo; el zoom respeta 12–18 (lo hace MapLibre) (SC6).
    - Sin `onRecenter` no hay controles (móvil igual que hoy).
    - axe sin infracciones.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map src/pages`.
  - Archivos: `shared/ui/base-map/{MapControls.tsx,MapControls.test.tsx,BaseMap.tsx,BaseMap.test.tsx}`, `widgets/stations-map/ui/StationsMap.tsx`, `pages/map/ui/DesktopMapPage.tsx`.
  - Dependencias: T2.

### Checkpoint: Fase 2

- [x] `pnpm check:task` en verde, salvo avisos explicados.
- [ ] `dev:mock` desde 768 px: tarjeta, aviso, favoritas, leyenda y controles.

### Fase 3: Cierre

- [x] **T8: Accesibilidad de la página y cierre** (S, ~45 min)
  - Descripción: test de axe de `DesktopMapPage` con una estación elegida. Test del orden de Tab: buscador → selector → aviso → favoritas → lista → mapa → tarjeta. «Usar mi ubicación» del aviso muestra «Localizando…» con `aria-busy` mientras pide la posición, como `LocateButton` (decisión del usuario tras T5). Revisar que el móvil no cambia. Changelog del plan.
  - Aceptación:
    - axe sin infracciones en la página de escritorio (SC7).
    - El orden de Tab es el de la spec.
    - «Usar mi ubicación» indica que está localizando.
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
- 2026-11-02: T2 hecha. `MapPage` elige entre `MobileMapPage` (la de hoy, renombrada) y `DesktopMapPage`, que monta su propio esqueleto (cabecera `banner` a todo el ancho y `main` con panel y mapa) en vez de usar `AppLayout`, así solo hay un `h1`; la rama de `md` de `AppLayout` queda sin uso en producción y se puede quitar más adelante. `useDataStatus().retry` devuelve la promesa de `refetch` para el `aria-busy` del indicador. `BaseMap` y `StationsMap` aceptan `label` («Mapa de estaciones» en escritorio; el móvil sigue con «Mapa de Madrid»). `MapPanel` y `useMapFocusPadding` dejan la rama de `md`, que ya no se usa. En `MapPage.test.tsx` el caso de escritorio del panel pasa a `DesktopMapPage.test.tsx` y la aserción del detalle con `?station` en `md` se reescribe a la fila de la lista (el detalle ya no está en el panel; la tarjeta llega en T4): el floor guard avisa de esa aserción. 11 tests más (601 en web); `check:task` en verde salvo ese aviso.
- 2026-11-02: nota sobre T2. En `MapPage.test.tsx` el caso `it.each([false, true])` del panel se quedó solo con `[false]`; el caso de escritorio (sin «Mi ubicación» suelto) lo cubre ahora `DesktopMapPage.test.tsx`, así que el caso quitado se sustituye, no se pierde.
- 2026-11-02: T3 hecha. `StationRow` gana `selected`: `bg-primary-soft`, anillo interior de 2 px `primary` (no cambia el tamaño de la fila) y `aria-current="true"`; el *hover* pasa a `bg-canvas`. Si la estación elegida está en favoritas y en cercanas se marcan las dos filas: es la misma estación, así que la aceptación «solo una fila con `aria-current`» se lee como «solo las filas de la estación elegida». `isSameStationNumber` en `entities/station` sustituye las dos comparaciones sin mayúsculas que había (mapa y detalle) y la usa la lista. `BaseMap` acepta `focusPadding.right` y solo lo manda a MapLibre si llega, así que el móvil no cambia; el escritorio deja 352 px a la derecha para la tarjeta. La aserción de `focusPadding` del caso de `md` de `MapPage.test.tsx` se reescribe a `{ bottom: 0, right: 352 }`: el floor guard avisa de ella y de la de T2. 12 tests más (613 en web); `check:task` en verde salvo esos dos avisos.
- 2026-11-02: T4 hecha. `useStationDetail` y `useStationDistance` bajan de `widgets/station-detail` a `entities/station`, y `MessageAction` a `shared/ui/state-message`, para que `widgets/station-card` los use sin importar otro *widget*. La tarjeta es una `section` con nombre por su `h2` (el nombre, o «Estación N» mientras carga o si falla), «Estación N · X m» encima, las dos insignias no decorativas con «bicis disponibles» y «anclajes libres», y `FavoriteButton` tal cual. «Cerrar» (icono con nombre) sirve para todos los estados, así que «no encontrada» no lleva acción propia; el error mantiene «Reintentar». Escape se escucha con un *listener* en la tarjeta (es una región, no un control). El foco vuelve a la fila con `useListFocusReturn` sobre el panel de escritorio; abierta desde el mapa, vuelve al primer encabezado de la lista, como en el móvil. 16 tests más (629 en web); `check:task` en verde salvo los dos avisos ya explicados de T2 y T3.
- 2026-11-02: arreglo de T4 tras la revisión visual con el lienzo. Cabecera de la tarjeta: «Estación N · X m» en seminegrita, el nombre en negrita y, a la derecha, la estrella como botón de solo icono de 44 px (`FavoriteButton` gana `variant="icon"`: `StarIcon` rellena al pulsarla, nombre y `title` «Añadir a favoritas» o «Quitar de favoritas», con `aria-pressed`) y después «Cerrar». Debajo, una rejilla de dos cajas iguales (`rounded-control`, `bg-chip`) con la insignia centrada y su texto. `AvailabilityBadge` gana `align` (`end` por defecto, `center` en la tarjeta). El botón «Favorita» de texto sigue en el detalle del móvil. El metadato usa `text-sm` (14 px) en vez de los 13 px del lienzo y las cajas `bg-chip` (#eef1f5) en vez de #F3F5F8, porque son los tokens que existen. En los tests nuevos de T4 cambia la consulta del botón de favorita al nuevo nombre. 6 tests más (635 en web); `check:task` en verde salvo los dos avisos ya explicados.
- 2026-11-02: T5 hecha. `StatusBanner` gana `icon` para cambiar el icono de su variante. `StationList` acepta `layout="desktop"` con `onLocate` (unión discriminada: sin `onLocate` no hay escritorio); el móvil sigue con sus textos y su aviso solo sin ubicación. En escritorio el aviso (`LocationIcon`) está siempre salvo mientras se pide la primera posición, reutiliza `isApproximateLocation` e `isLocationDenied` de `useMapLocation`, y «Usar mi ubicación» llama a `location.locate`. El subtítulo de «Cerca de ti» o «Cerca de la Puerta del Sol» pasa a «Ordenadas por distancia» en lugar de «Bicis disponibles» o «Anclajes libres», porque las tarjetas del selector ya lo dicen; favoritas lo mantiene. Ninguna aserción existente cambia. 8 tests más (644 en web); `check:task` en verde salvo los dos avisos ya explicados de T2 y T3.
- 2026-11-02: arreglo de la tarjeta tras la revisión visual: la estrella baja junto al nombre, bajo «Cerrar» (rejilla de dos filas; Tab llega antes a «Cerrar»).
- 2026-11-02: decisiones del usuario tras T5. Se mantiene «Ordenadas por distancia» en lugar del subtítulo del modo. La estrella de solo icono se llama siempre «Favorita», como la de texto, con `aria-pressed` para el estado; «Añadir a favoritas» o «Quitar de favoritas» quedan solo en el `title` (regla WAI-ARIA APG del proyecto). Cambian las consultas de los tests de la estrella añadidos en este módulo. T8 añade «Localizando…» al botón «Usar mi ubicación».
- 2026-11-02: T6 hecha. `shared/ui/collapsible-section` es genérica (título, contador, icono y clave de `localStorage` por props): `section` con nombre por su `h2`, que envuelve el botón de cabecera (`aria-expanded`, `aria-controls`, «Favoritas · N», `ChevronIcon` que gira 180° sin animación con movimiento reducido) y lleva `tabIndex={-1}` para que `useListFocusReturn` pueda seguir dándole el foco; el contenido plegado queda con `hidden`. El estado usa `useLocalStorage` con la clave `FAVORITES_OPEN_STORAGE_KEY`; un valor no booleano cuenta como abierta. `FavoriteStations` gana `isCollapsible` (escritorio, desde `layout`): un `div` con `data-station-list="favorites"` envuelve la sección para que la vuelta del foco a la fila siga funcionando, y en escritorio favoritas pierde el subtítulo «Bicis disponibles» o «Anclajes libres», porque las tarjetas del selector ya lo dicen (como «Cerca de ti» en T5). `AvailabilityLegend` va en el pie del panel antes de la atribución: `ul` con nombre por un `h2` oculto «Leyenda» y muestras redondas `aria-hidden` con los tokens de disponibilidad; «Vacía» con borde discontinuo de 2 px como la insignia y «Sin confirmar» con borde de `availability-unconfirmed-line` (token que no usaba nadie) para que el gris se vea sobre blanco. El móvil no cambia y ninguna aserción existente cambia. 14 tests más (658 en web); `check:task` en verde salvo los dos avisos ya explicados de T2 y T3 (pasos restantes a mano: cobertura de líneas cambiadas 100 %, capas sin violaciones).
- 2026-11-02: T7 hecha. `MapControls` son tres `button` nativos de 44 px apilados (`bg-surface`, `shadow-control`, anillo de foco `primary` como el resto) con `PlusIcon`, `MinusIcon` y `LocationIcon` `aria-hidden` y nombre por `aria-label`. `BaseMap` los pinta dentro de su `section` (así son parte de la región del mapa y van antes del lienzo al tabular) solo si recibe `onRecenter` y cuando el mapa ha cargado; acercar y alejar llaman a `zoomIn` y `zoomOut` sin argumentos, y MapLibre aplica los límites 12–18. Van en `right-4 bottom-12`: encima de la atribución compacta, que desde `md` está abajo a la derecha, y lejos de la tarjeta, arriba a la derecha. La `section` del mapa gana `isolate` para que el `z-index` de los controles no salga del mapa y la tarjeta quede encima si se cruzan en una ventana baja. `StationsMap` pasa `onRecenter` y en escritorio es `location.locate`, como «Usar mi ubicación»; el móvil no lo pasa y no tiene controles. Ninguna aserción existente cambia; el mock de MapLibre de `BaseMap.test.tsx` gana `zoomIn` y `zoomOut`. 12 tests más (670 en web); `check:task` en verde salvo los dos avisos ya explicados de T2 y T3 (pasos restantes a mano: cobertura de líneas cambiadas 100 %, capas sin violaciones).
- 2026-11-02: decisión del usuario tras T6: en escritorio favoritas tampoco lleva el subtítulo del modo («Bicis disponibles» o «Anclajes libres»), como la lista de cercanas.
- 2026-11-02: T8 hecha. La acción de `StatusBanner` gana `isPending`: como `LocateButton`, el botón queda `aria-busy` y `aria-disabled` (sigue enfocable) e ignora los clics. En escritorio `StationList` recibe `isLocating` (`status === 'pending'` de `useMapLocation`) y el aviso dice «Localizando…» mientras pide la posición; el aviso sigue en pantalla porque `useMapLocation` conserva la última respuesta. El test de axe de `DesktopMapPage` espera a que la tarjeta esté abierta. El test del orden de Tab recorre la página con favoritas y sin ubicación: «Actualizar» de la cabecera → buscador → «Sacar bici» y «Dejar bici» → «Usar mi ubicación» → «Favoritas · 1» → filas de favoritas y de cercanas → enlace de la atribución → controles del mapa → «Cerrar» y «Favorita» de la tarjeta; es el orden de la spec, con la cabecera antes y el pie del panel antes del mapa, así que no cambia nada. El *mock* de `BaseMap` pinta un botón «Centrar en mi posición» cuando recibe `onRecenter`, en lugar de los controles reales (jsdom no tiene WebGL); que los controles van antes del lienzo dentro del mapa queda para el recorrido manual. `AppLayout` pierde la rama de `md` (solo la usa `MobileMapPage`, que no se monta desde `md`) y la clase `md:flex-row`; se quitan sus tres tests de escritorio y la aserción de la altura deja de pedir `md:flex-row`: el floor guard avisa de esas nueve aserciones, cuya cobertura pasa a los tests de `DesktopMapPage`. El móvil no cambia: sus tests pasan sin tocarlos. 5 tests más y 3 menos (672 en web); `check:task` en verde salvo esos avisos y los dos ya explicados de T2 y T3 (pasos restantes a mano: cobertura de líneas cambiadas 100 %, capas sin violaciones, `build` correcto). Quedan sin marcar las comprobaciones manuales en `dev:mock` y la de CI del checkpoint final.
