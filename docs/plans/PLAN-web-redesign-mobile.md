# Plan: web-redesign-mobile

- Created: 2026-11-03
- Status: **approved** (2026-11-03)
- Spec: [SPEC-web-redesign-mobile.md](../specs/SPEC-web-redesign-mobile.md)

## Overview

Componer la pantalla móvil (< 768 px): mapa a pantalla completa con buscador y modo flotantes, botón de centrar que sigue al panel y `BottomSheet` con tres alturas por toques. El panel muestra la lista con su cabecera («N estaciones con bicis», «Ver todas / Ver mapa») o, con una estación elegida, su detalle con «Volver a la lista» y la estrella. Desde 768 px la página no cambia.

## Decisiones de implementación

- **Rama `feat/web-redesign-mobile`, un PR y un commit por tarea.** Sin `Co-Authored-By`. El PR toca `web/` y `docs/`. Título `feat(web): lay out the mobile screen of the redesign`: publica una release de la web. La spec y este plan van en el commit de T1.
- **Primero el panel (T1)**, porque todo lo demás se apoya en sus alturas. Mientras llega el resto, `MobileMapPage` traduce el «abierto / cerrado» de hoy a `half` / `peek`, así que la app funciona tras cada commit.
- **`BottomSheet` sigue siendo genérico** (`shared/ui`): recibe `snap`, `onSnapChange`, el ciclo del asa, su `aria-label`, una cabecera y el contenido. Qué ciclo y qué etiqueta usar (lista o detalle) lo decide la página.
- **El panel se superpone al mapa** en lugar de ocupar una franja en el flujo, salvo la franja de `peek`, que sigue en el flujo para que la atribución del mapa no quede tapada. `useBottomSheetOverlap(snap)` devuelve lo que tapa cada altura y alimenta `focusPadding.bottom` y la posición del botón de centrar.
- **El detalle reutiliza la tarjeta de escritorio**: `StationCard` gana `layout="sheet"`, que cambia solo la cabecera (flecha, título, estrella) y añade el pie de actualización. `widgets/station-detail` y `MapPanel` se borran cuando el detalle nuevo los sustituye (T4).
- **El escritorio no se toca.** Sus tests deben pasar sin cambios; los cambios de piezas compartidas (`BottomSheet`, `StationCard`, `StationList`, `TransitSearch`) entran por variantes nuevas con la de hoy por defecto.
- **Foco.** Abrir el detalle no mueve el foco; «Volver a la lista» y Escape lo devuelven a la fila con `useListFocusReturn`, o al primer encabezado de la lista si se abrió desde el mapa, la búsqueda o un enlace.

## Grafo de dependencias

```
T1 BottomSheet de tres alturas
   │
   └─► T2 composición móvil (mapa completo, buscador y modo flotantes, centrar)
          │
          ├─► T3 cabecera y contenido de la lista
          │
          └─► T4 detalle en el panel (y se borra el de hoy)
                 │
                 └─► T5 cierre: axe, orden de Tab y reducir movimiento
```

## Task List

### Fase 1: Panel y composición

- [x] **T1: `BottomSheet` de tres alturas** (M, ~1 h 30 min)
  - Descripción: `sheetSize.ts` pasa a `SHEET_HEIGHT_PX = { peek: 112, half: 430, full: 700 }` y el margen superior de `full` (144 px). `BottomSheet({ label, snap, onSnapChange, nextSnap, handleLabel, header, children })`: alto por `snap` con `min()` contra `100dvh − 144px`, animado con `duration-320 ease-sheet motion-reduce:transition-none`; asa `<button>` de 44 px con barra `aria-hidden`, `aria-label` del padre, `aria-expanded` falso solo en `peek` y `aria-controls` al cuerpo; en `peek` el cuerpo es `inert` y oculto. `useBottomSheetOverlap(snap)`. `MobileMapPage` traduce `usePanelExpanded` a `half` / `peek` mientras llega T2.
  - Aceptación:
    - El asa llama a `onSnapChange(nextSnap[snap])` con su `aria-label` y `aria-expanded` (SC2).
    - `full` nunca pasa de `100dvh − 144px` y `half` nunca pasa de `full`.
    - La clase `motion-reduce:transition-none` está en el panel; axe sin infracciones en las tres alturas.
    - El móvil de hoy sigue funcionando y los tests de escritorio pasan sin cambios.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/bottom-sheet src/pages`.
  - Archivos: `shared/ui/bottom-sheet/{BottomSheet.tsx,BottomSheet.test.tsx,sheetSize.ts,useBottomSheetOverlap.ts,useBottomSheetOverlap.test.ts,index.ts}`, `pages/map/ui/MobileMapPage.tsx`, `pages/map/model/useMapFocusPadding.ts`, `widgets/app-layout/*`, spec y este plan.
  - Dependencias: ninguna.

- [x] **T2: Composición móvil** (M, ~1 h 30 min)
  - Descripción: `MobileMapPage` deja `AppLayout` (se borra `widgets/app-layout`) y monta `main` con `h1` oculto, mapa a pantalla completa, buscador y modo flotantes arriba y `BottomSheet`. `TransitSearch` gana `variant="floating"` (50 px, `rounded-full`, `shadow-float`, etiqueta oculta visualmente). `NeedToggle variant="pill"` con fondo `surface` y `shadow-float`, a la derecha. Botón de centrar redondo de 48 px, 16 px por encima del panel con la misma curva y oculto en `full`; llama al `locate` de `useUserFocus`. `useSheetSnap` sustituye a `usePanelExpanded`: arranca en `half`; con ciclo de lista `peek → half → full → half`. El panel sigue mostrando el contenido de hoy sin `LocateButton`.
  - Aceptación:
    - Por debajo de 768 px: mapa completo, buscador de 50 px, modo en píldora, botón de centrar y panel en `half` (SC1).
    - El botón de centrar sigue al panel y se oculta en `full` (SC3).
    - `focusPadding.bottom` sigue a la altura actual.
    - Los tests de escritorio pasan sin cambios.
  - Verificación: `pnpm --filter web exec vitest run src/pages src/widgets`.
  - Archivos: `pages/map/ui/MobileMapPage.tsx`, `pages/map/model/{useSheetSnap.ts,useSheetSnap.test.ts,useMapFocusPadding.ts}`, `pages/map/model/usePanelExpanded*` (se borra), `widgets/transit-search/ui/TransitSearch*`, `pages/map/ui/MapPage.test.tsx`.
  - Dependencias: T1.

### Checkpoint: Fase 1

- [ ] `pnpm check:task` en verde, salvo avisos de aserciones reescritas explicados.
- [ ] `dev:mock` a 390 × 844 y 375 × 667: mapa completo, controles flotantes, tres alturas con el asa y el botón de centrar siguiéndolas.

### Fase 2: Contenido del panel

- [x] **T3: Cabecera y contenido de la lista** (M, ~1 h 30 min)
  - Descripción: cabecera del panel con `h2` «N estaciones con bicis» o «con hueco» (N = cercanas con al menos una en el modo actual), subtítulo «Cerca de la Puerta del Sol · hace N s» o «Cerca de ti · hace N s» (`useDataStatus` y `RelativeTime`) y «Ver todas» / «Ver mapa» con la flecha girada 180°, `aria-controls` al cuerpo. `StationList layout="mobile"`: aviso compacto «Sin tu ubicación: cerca de la Puerta del Sol» con «Activar» (`aria-busy` mientras pide), «Usando tu ubicación actual.» y el texto de denegado sin acción; favoritas plegables; `h3` «Cercanas»; sin «Ordenadas por distancia» ni leyenda; atribución al pie.
  - Aceptación:
    - El recuento y «bicis» / «hueco» cambian con el modo; el subtítulo con la ubicación (SC4).
    - «Ver todas» lleva a `full` y «Ver mapa» a `peek` (SC2).
    - Los tres casos del aviso y «Activar» con `aria-busy` (SC6).
    - axe sin infracciones; los tests de escritorio de `StationList` pasan sin cambios.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-list src/pages`.
  - Archivos: `widgets/station-list/ui/{StationList.tsx,LocationNotice.tsx,NearbyStations.tsx,StationList.test.tsx}`, `widgets/station-list/model/` (recuento), `pages/map/ui/{MobilePanel.tsx,MobileSheetHeader.tsx}`, `pages/map/ui/MobileMapPage.tsx`.
  - Dependencias: T2.

- [x] **T4: Detalle en el panel** (M, ~2 h)
  - Descripción: `StationCard` gana `layout="sheet"`: sin posición absoluta ni sombra; cabecera con la flecha «Volver a la lista» (44 px, `primary`), «Estación N · X m» y el nombre como `h2`, y `FavoriteButton variant="icon"`; insignias de hoy; pie «Actualizado hace N s». Con `?station`, el panel cambia la cabecera de la lista por la del detalle, su `aria-label` a «Detalle de la estación» y el ciclo del asa a `half ↔ peek` («Reducir detalle» / «Ampliar detalle»). `useSheetSnap`: al abrir pasa a `half` y guarda la altura de la lista; elegir otra estación no la pisa; al volver la recupera. «Volver a la lista» y Escape quitan `?station` y devuelven el foco con `useListFocusReturn`. Se borran `widgets/station-detail`, `MapPanel`, `features/locate-user` (sin uso desde T2, decisión del usuario) y sus tests.
  - Aceptación:
    - Elegir en mapa o lista abre el detalle en `half` desde cualquier altura sin mover el foco (SC5).
    - Con el detalle, el asa alterna `half ↔ peek` y no hay «Ver todas».
    - «Volver a la lista» y Escape vuelven a la altura anterior, sin estación marcada y con el foco en la fila (SC5).
    - Orden de tabulación del detalle: flecha → estrella; los tests de escritorio de `StationCard` pasan sin cambios.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-card src/pages`; `pnpm --filter web depcruise`.
  - Archivos: `widgets/station-card/ui/{StationCard.tsx,SelectedStationCard.tsx,CardHeader.tsx,SheetCardHeader.tsx,StationCard.test.tsx}`, `shared/ui/icons/` (flecha atrás), `pages/map/model/useSheetSnap*`, `pages/map/ui/{MobileMapPage.tsx,MobilePanel.tsx}`, `widgets/station-detail/*`, `features/locate-user/*` y `pages/map/ui/MapPanel.tsx` (se borran).
  - Dependencias: T3.

### Checkpoint: Fase 2

- [ ] `pnpm check:task` en verde, salvo avisos explicados.
- [ ] `dev:mock` a 390 × 844: elegir en mapa, favoritas y cercanas; estrella; volver con la flecha y con Escape a la altura anterior.

### Fase 3: Cierre

- [ ] **T5: Accesibilidad de la página y cierre** (S, ~45 min)
  - Descripción: test de axe de `MobileMapPage` en `peek`, `half`, `full` y con el detalle abierto. Test del orden de Tab: buscador → modo → centrar → asa → «Ver todas» → aviso → favoritas → lista → mapa. Revisar que el escritorio no cambia. Changelog del plan.
  - Aceptación:
    - axe sin infracciones en la página móvil y con el detalle (SC7).
    - El orden de Tab es el de la spec.
    - SC8: `pnpm check:task`.
  - Verificación: `pnpm check:task`; recorrido manual en `dev:mock` con y sin «reducir movimiento».
  - Archivos: `pages/map/ui/MobileMapPage.test.tsx`, este plan.
  - Dependencias: T4.

### Checkpoint final

- [ ] SC1-SC8 comprobados; CI en verde.
- [ ] Pedir permiso antes de push, abrir el PR y hacer merge.
- [ ] Después del despliegue: comprobar en Render en un móvil (geolocalización incluida); marcar spec, plan y capability map como **implemented**.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| El panel superpuesto tapa la atribución del mapa | Medio | La franja de `peek` sigue en el flujo; el mapa acaba encima de ella |
| `full` de 700 px no cabe en pantallas bajas | Medio | `min(700px, 100dvh − 144px)` y `half` limitado a `full` |
| Variantes nuevas rompen el escritorio | Medio | Variante de hoy por defecto; los tests de escritorio no se tocan |
| Borrar `station-detail` deja huérfanos `entities` o `shared` | Bajo | `depcruise` y búsqueda de usos antes de borrar en T4 |
| jsdom no calcula alturas ni `dvh` | Bajo | Los tests comprueban `snap`, estilos en línea y clases, no el tamaño real; el tamaño se revisa en `dev:mock` |

## Paralelización

T3 y T4 tocan `MobileMapPage.tsx` y el contenido del panel; se hacen en serie.

## Estimación

Unas 7 h 15 min en total. Fase 1 ~3 h, fase 2 ~3 h 30 min y fase 3 ~45 min.

## Changelog

- 2026-11-03: borrador a partir de la spec aprobada.
- 2026-11-03: aprobado por el usuario.
- 2026-11-03: T1 hecha. `BottomSheet` controlado (`snap`, `onSnapChange`, `nextSnap`, `handleLabel`, `header`); las tres alturas usan `min(N px, 100dvh − 144px)`, así `half` nunca pasa de `full`. El asa ya no lleva texto visible, solo la barra y su `aria-label`. La región (`section` con `label`) envuelve cabecera y cuerpo; el asa queda fuera, como hoy. En `peek` el cuerpo es `inert` e `invisible`, con la visibilidad animada para que siga pintado mientras se cierra. Puente provisional en `MobileMapPage` (`usePanelSnap`) sobre `usePanelExpanded` con un estado de `full`: con el ciclo de lista el asa ya no vuelve a `peek`; vuelve con «Ver mapa» en T3, y T2 cambia el arranque a `half`. El floor guard avisa de 44 aserciones reescritas del panel de dos estados (`BottomSheet`, `useBottomSheetOverlap`, `AppLayout`, `MapPage` y el nombre del asa en `DesktopMapPage.test.tsx`). 698 tests en web; `check:task` en verde salvo ese aviso.
- 2026-11-03: T2 hecha. `MobileMapPage` monta su propio `main` (se borran `widgets/app-layout` y `usePanelExpanded`) con buscador y modo flotantes, `RecenterButton` y el panel. La variante flotante vive en `features/search-by-number` (`SearchVariant` `inline` o `floating`) y `TransitSearch` la pasa; en la flotante también la ayuda queda oculta visualmente, sigue en `aria-describedby`, y los resultados se abren sobre el mapa. `RecenterButton` (48 px, `LocationIcon`) sube con el panel, desaparece en `full` y, como `MapControls`, queda `aria-busy` mientras localiza; sigue visible con el permiso denegado, como el «Mi ubicación» de hoy en el móvil. `useSheetSnap` arranca en `half` y sube de `peek` a `half` al elegir estación. Los casos con `peek` se prueban en las unidades hasta que «Ver mapa» llegue en T3. Pendiente para T5: hoy el mapa va antes del panel en el orden de Tab. `features/locate-user` queda sin uso. El floor guard avisa de las aserciones reescritas en `MapPage.test.tsx` por el arranque en `half` y por los controles que salen del panel, y de las de `AppLayout.test.tsx`, que se borra con su componente y cuyas comprobaciones pasan a `MapPage.test.tsx`. 713 tests en web; `check:task` en verde salvo ese aviso.
- 2026-11-03: T3 hecha. `MobileSheet` agrupa el panel de la página; `MobileSheetHeader` lleva el título, el subtítulo y «Ver todas» / «Ver mapa»; `MapPanel` pasa a `MobilePanel` (T4 le quita el detalle). El recuento (`useNearbyAvailability`) cuenta las cercanas en servicio con al menos una bici o un anclaje libre, también sin confirmar; con una sola dice «1 estación con …»; sin datos, el título es «Estaciones cercanas» y el subtítulo solo dice el lugar. La antigüedad sale de `RelativeTime`, como en el resto de la app («hace 30 segundos»), no la forma corta del lienzo. La flecha apunta arriba en «Ver todas» y abajo en «Ver mapa», como el lienzo. `StationList layout="mobile"`: aviso con «Activar» (mantiene el texto y queda `aria-busy` mientras pide), favoritas y «Cercanas» como `h3`, sin «Actualizado hace…» en la lista porque ya lo dice la cabecera. `DesktopLocationNotice` pasa a `LocatingNotice` para las dos pantallas, sin cambiar los textos de escritorio. `CollapsibleSection` acepta `level` y `BottomSheet` acepta `bodyId`. El floor guard avisa de las aserciones de `MapPage.test.tsx` con los títulos «Cerca de ti» / «Cerca de la Puerta del Sol» y el aviso de hoy, que pasan a «Cercanas», a «Favoritas · N» y al aviso nuevo. 735 tests en web; `check:task` en verde salvo ese aviso.
- 2026-11-03: T4 hecha. En vez de `layout="sheet"` en `StationCard`, `widgets/station-card` exporta dos piezas: `StationSheetHeader` (flecha «Volver a la lista», meta, nombre como `h2` y estrella) va en la cabecera del panel, visible en `peek`, y `StationSheetBody` (insignias y «Actualizado hace…») en el cuerpo, que es `inert` en `peek`. Un solo componente no puede pintar en las dos ranuras. Las dos usan `useStationDetail`, que tira de la caché, y Escape vuelve a la lista desde las dos. La tarjeta de escritorio no cambia. `useSheetSnap`: abrir lleva a `half` desde cualquier altura y guarda la de la lista; elegir otra estación mantiene la altura actual y la guardada; volver (flecha, Escape o el «Atrás» del navegador) la recupera. La edad del pie es la del detalle o la de la lista completa cuando el detalle se apoya en ella. La atribución de datos solo va con la lista. Se borran `widgets/station-detail` y `features/locate-user` (decisión del usuario) con sus tests. El detalle nuevo tiene los estados de la tarjeta de escritorio, así que dirección, anclajes totales, «Sin servicio», el aviso de datos antiguos y el foco al título al abrir no se trasladan (los avisos llegan con `web-error-states`). El floor guard avisa de los dos archivos de test borrados y de las aserciones de `MapPage.test.tsx` y `useSheetSnap.test.ts` que esperaban el detalle de hoy. Pendiente para T5: el foco se pierde al abrir desde una fila (la fila desaparece) y al volver a una lista en `peek` (cuerpo `inert`). 751 tests en web; `check:task` en verde salvo ese aviso.
