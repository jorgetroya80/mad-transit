# Plan: web-ui-migration

- Created: 2026-11-11
- Status: **approved** (2026-11-12)
- Spec: [SPEC-web-ui-migration.md](../specs/SPEC-web-ui-migration.md)

## Overview

Pasar las pantallas de BiciMAD a la librería de `shared/ui` y retirar lo que sustituye, en seis PRs por zona (supuesto 10 de la spec): base, lista, ficha, buscador y panel, mapa y retirada. Cada PR sale de `main`, migra su zona entera, borra lo viejo que deja sin uso y se mergea tras la revisión visual del usuario. Los PRs 2 a 5 son `feat(web)` y el 1 y el 6 `refactor(web)`; el PR de release se mergea al final, así que sale una sola web 0.11.0.

## Decisiones de implementación

- **Una rama por PR desde `main`**, `feat/web-ui-migration-<n>-<zona>`, abierta después de mergear la anterior. Un commit por tarea, sin `Co-Authored-By`. La spec, este plan y el capability map van en el commit de T1.
- **Test primero en cada zona** (supuesto 8): la aserción de clase pasa a la clase nueva y falla, después se migra la zona. Antes de borrar el test de una pieza vieja, la tarea apunta en el changelog dónde queda probado lo que comprobaba, y añade lo que falte.
- **Los textos salen de donde están hoy:** `availabilityStatusText`, `availabilityCountText`, `availabilityLabel` (`entities/station`) y las constantes de cada widget. Ninguno cambia.
- **Comparar antes y después:** cada tarea mira su zona con `pnpm --filter web dev` a 1440 y 390 px contra el lienzo y apunta en el changelog lo que cambia (supuesto 3).
- **Si el floor guard avisa,** se corre solo para ver la lista y después el resto de `check:task` por separado, y el cuerpo del commit explica cada aviso (supuesto 8).
- **Sin cambios en la librería** salvo quitar `arrow-left` (T2). Si una pantalla necesita otro parámetro, se pregunta antes.
- **Sin dependencias nuevas.**

## Grafo de dependencias

```
PR 1 base     T1 availabilityTone + focus-ring en lo que se queda ─┐
              T2 sin arrow-left                                     │
                                                                    ▼
PR 2 lista    T3 filas (ListItem, CountBadge) ─► T4 favoritas y leyenda ─► T5 avisos y estados de la lista
                                                                    │
PR 3 ficha    T6 Card (cabecera, estrella, volver) ─► T7 cuerpo (StatTile, errores) ── borra AvailabilityBadge,
                                                                    │                    ErrorState, StateMessage
PR 4 buscador T8 SearchField, NoResults ─► T9 NeedToggle ─► T10 avisos del panel e indicador ── borra StatusBanner
                                                                    │
PR 5 mapa     T11 puntos con drawMapPoint ─► T12 posición del usuario ─► T13 controles y MapNotice
                                                                    │
PR 6 retirada T14 iconos y tokens viejos, test de retirada ─► T15 sin /dev/components, cierre
```

Las zonas son independientes en el código, pero comparten `shared/ui/index.ts`, las pantallas de `pages/map` y lo que cada una borra, así que van en serie: un PR detrás de otro.

## Task List

### PR 1: Base (`feat/web-ui-migration-1-base`)

- [x] **T1: `availabilityTone()` y `focus-ring` en lo que se queda** (S, ~45 min)
  - Descripción: `availabilityTone(level)` en `entities/station/model/availability.ts` (supuesto 2), exportada desde `entities/station`, con su tabla `satisfies Record<AvailabilityLevel, …>` y los 6 tonos sin `inverse`. `ResultList`, `BottomSheet` y `StationSection` cambian sus anillos escritos a mano por la clase `focus-ring` (supuesto 7). Spec, plan y capability map entran en este commit.
  - Aceptación:
    - Cada nivel da su tono (`good` → `success` … `unconfirmed` → `muted`), con test.
    - Los tres componentes usan `focus-ring` y sus tests de foco y teclado pasan sin cambios; a la vista el anillo es el mismo (2 px `primary` a 2 px).
  - Verificación: `pnpm --filter web exec vitest run src/entities/station src/features/search-by-number src/shared/ui/bottom-sheet src/widgets/station-list`; `pnpm check:task`.
  - Archivos: `entities/station/{model/availability.ts,model/availability.test.ts,index.ts}`, `features/search-by-number/ui/ResultList.tsx`, `shared/ui/bottom-sheet/BottomSheet.tsx`, `widgets/station-list/ui/StationSection.tsx`, spec, plan, capability map.
  - Dependencias: ninguna.

- [x] **T2: `Icon` sin `arrow-left`** (XS, ~15 min)
  - Descripción: quitar el nombre `arrow-left` de `ICON_NAMES` y de `iconDrawings.ts`, y su ejemplo de la sección «Iconos» de `/dev/components` (supuesto 5). La librería queda con 20 nombres.
  - Aceptación: los tests de `Icon` recorren los 20 nombres; `arrow-left` no compila; el test de la página sigue pasando.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/icons src/pages/dev-components`; `pnpm check:task`.
  - Archivos: `shared/ui/icons/{iconDrawings.ts,Icon.test.tsx}`, `pages/dev-components/ui/IconSection.tsx` (si nombra el icono).
  - Dependencias: ninguna.

#### Checkpoint PR 1
- [ ] `pnpm check:task` en verde; nada cambia a la vista (`refactor(web)`).
- [ ] Permiso del usuario para push, PR y merge.

### PR 2: Lista (`feat/web-ui-migration-2-list`)

- [x] **T3: filas de estación con `ListItem` y `CountBadge`** (M, ~1 h 30 min)
  - Descripción: `StationRows` monta `ListItem` (`onSelect`, `accessibleLabel`, `selected`, `subtitle` con distancia y paseo, `leadingText` con el número) y en `trailing` un `CountBadge` con `availabilityTone`, `availabilityLabel` y `srText`, con `trailingCaption` de `availabilityStatusText`. Se borra `StationRow` (`entities/station/ui`).
  - Aceptación:
    - Los nombres accesibles y el orden de lectura de cada fila son los de hoy; los tests de `StationList` de selección, foco de vuelta y estados pasan sin cambiar su comportamiento.
    - Antes de borrar `StationRow.test.tsx`, cada aserción suya está cubierta en `StationList.test.tsx`, en los tests de texto de `entities/station` o en `ListItem`/`CountBadge` (lista en el changelog).
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-list src/entities/station src/pages/map`; floor guard y resto de `check:task` (supuesto 8).
  - Archivos: `widgets/station-list/ui/StationRows.tsx`, `entities/station/ui/StationRow{,.test}.tsx`, `entities/station/index.ts`, `widgets/station-list/ui/StationList.test.tsx`.
  - Dependencias: T1.

- [x] **T4: favoritas con `Disclosure` y leyenda con `Legend`** (S, ~1 h)
  - Descripción: `FavoriteStations` guarda el estado con `useLocalStorage` (`FAVORITES_OPEN_STORAGE_KEY`, `parseOpen`, abierta por defecto) y monta `Disclosure` con `icon="star-filled"`, `count` y `headingLevel` (supuesto 6). `AvailabilityLegend` monta `Legend` con los cinco tonos y sus textos. Se borra `CollapsibleSection`.
  - Aceptación:
    - «Favoritas · 2» como nombre del botón y de la región, el estado sobrevive a recargar y `data-station-list="favorites"` sigue en su sitio (tests de `StationList` sin cambios).
    - La leyenda dice lo mismo que hoy, en el mismo orden.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-list src/shared/ui`; floor guard y resto de `check:task`.
  - Archivos: `widgets/station-list/ui/{FavoriteStations,AvailabilityLegend}.tsx` (+ tests), `shared/ui/collapsible-section/*`, `shared/ui/index.ts`.
  - Dependencias: T3.

- [x] **T5: avisos y estados de la lista** (M, ~1 h 30 min)
  - Descripción: `ApproximateLocationNotice` y `LocatingNotice` montan `Banner` `info` (con la acción ocupada de «Usar mi ubicación» / «Activar»). `NearbyStations` cambia sus bloques de error, sin conexión y lista vacía (`ErrorState`, `StateMessage`, iconos viejos) por `EmptyState` con sus textos, tono, `note` y acción. `StationSection` pasa a los tokens y la escala `text-*` nuevos.
  - Aceptación:
    - Las regiones vivas son las de hoy (un aviso por causa, `web-error-states`): `alert` en el error, `status` donde hoy es `output`, ninguna en los avisos fijos.
    - Los textos, las acciones y el foco tras «Reintentar» no cambian.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-list src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `widgets/station-list/ui/{LocationNotice,NearbyStations,StationSection}.tsx`, `widgets/station-list/ui/StationList.test.tsx`.
  - Dependencias: T3.

#### Checkpoint PR 2
- [x] Resto de `check:task` en verde y avisos del floor guard explicados en cada commit.
- [x] Revisión visual del usuario de la lista (escritorio y panel móvil) en cada estado, a 1440 y 390 px.
- [ ] Permiso para push, PR y merge.

### PR 3: Ficha (`feat/web-ui-migration-3-card`)

- [x] **T6: la ficha con `Card`, la estrella y volver con `IconButton`** (M, ~1 h 30 min)
  - Descripción: `StationCard` (escritorio, `float`) y `StationSheet` (móvil, `flat`) montan `Card` con `titleId`, `onEscape` (sustituye al uso directo de `useCloseOnEscape`) y `Card.Header` (`meta` con `StationMeta`, título enfocable por código, acciones). `FavoriteButton` monta `IconButton` con `pressed`, `icon="star"`, `pressedIcon="star-filled"` y `tooltip`. El botón de volver es `IconButton` `ghost` con `chevron-left` de 22 px y `iconTone="primary"` (supuesto 5). `CardHeader` y `SheetCardHeader` se quedan como piezas del widget que montan `Card.Header`, o desaparecen si `Card.Header` basta.
  - Aceptación:
    - Escape cierra la ficha desde cualquier control y el foco vuelve como hoy (`useListFocusReturn`); el título recibe el foco al abrir.
    - «Favorita» sigue siendo el nombre de la estrella, con su tooltip y `aria-pressed`.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-card src/features/toggle-favorite src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `widgets/station-card/ui/{StationCard,StationSheet,SelectedStationCard,CardHeader,SheetCardHeader}.tsx` (+ tests), `features/toggle-favorite/ui/FavoriteButton{,.test}.tsx`.
  - Dependencias: PR 2 mergeado.

- [x] **T7: el cuerpo de la ficha con `StatTile` y sus errores** (M, ~1 h 30 min)
  - Descripción: `CardAvailability` monta dos `StatTile` con `availabilityTone`, cifra, texto y `statusLabel` (supuesto 3). `CardBody` cambia sus estados (cargando, no encontrada, error de carga, fuera de servicio, sin confirmar) por `Card.Body` `busy`, `EmptyState` y `Banner`. Se borran `AvailabilityBadge`, `ErrorState` y `StateMessage`.
  - Aceptación:
    - Las cajas toman el tono (fondo suave y borde; vacía en blanco con borde discontinuo); el lector oye lo mismo que hoy.
    - Cada estado de la ficha de `web-error-states` mantiene su texto, su región viva y su acción.
    - Cada aserción de los tests borrados queda cubierta (lista en el changelog).
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-card src/entities/station src/shared/ui src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `widgets/station-card/ui/{CardAvailability,CardBody,CardFooter}.tsx` (+ tests), `entities/station/ui/AvailabilityBadge{,.test}.tsx`, `entities/station/index.ts`, `shared/ui/{error-state,state-message}/*`, `shared/ui/index.ts`.
  - Dependencias: T6.

#### Checkpoint PR 3
- [x] Resto de `check:task` en verde y avisos explicados.
- [x] Revisión visual del usuario de la ficha en escritorio y móvil, en cada estado, a 1440 y 390 px.
- [ ] Permiso para push, PR y merge.

### PR 4: Buscador y panel (`feat/web-ui-migration-4-search`)

- [x] **T8: el buscador con `SearchField` y `NoResults` con `EmptyState`** (M, ~1 h 15 min)
  - Descripción: `SearchInput` monta `SearchField` (`label`, `clearLabel`, `hint`, `error`, `inputMode="numeric"`, `busy`, `shape` según la pantalla) y pierde su `FOCUS_RING`. `NoResults` monta `EmptyState` con `announce="status"`, sus acciones y la sugerencia de la estación cercana. `ResultList` y `SourcePicker` no cambian.
  - Aceptación: Escape con texto borra y deja el foco en la caja; las flechas siguen moviéndose por los resultados; los textos y el anuncio de «sin resultados» no cambian.
  - Verificación: `pnpm --filter web exec vitest run src/features/search-by-number src/widgets/transit-search src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `features/search-by-number/ui/{SearchInput,NoResults,SearchByNumber}.tsx` (+ test).
  - Dependencias: PR 3 mergeado.

- [x] **T9: `NeedToggle` con `SegmentedControl`** (S, ~45 min)
  - Descripción: `NeedToggle` monta `SegmentedControl` (`cards` en escritorio con descripción, `pill` en móvil) con `label="¿Qué quieres hacer?"` oculta e iconos `bike` y `dock`, y pierde su `FOCUS_RING` (supuesto 4).
  - Aceptación: Tab pasa por cada opción y Enter o Espacio la elige, como hoy; `aria-pressed` y los nombres no cambian; la descripción sigue fuera del nombre.
  - Verificación: `pnpm --filter web exec vitest run src/features/filter-by-need src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `features/filter-by-need/ui/NeedToggle{,.test}.tsx`.
  - Dependencias: T8.

- [x] **T10: avisos del panel e indicador de actualización** (M, ~1 h 30 min)
  - Descripción: `StaleNotice` monta `Banner` `warning` con título y acción «Reintentar» ocupada; `OfflineBar` y `OfflineBanner` montan `Banner` `inverse` (`bar` y `card`). `UpdatedIndicator` monta `StatusText` con su tabla de tonos (supuesto 2) y un `Button` `sm`. `MobileSheetHeader` pasa a `tone-*` y `text-meta` (supuesto 3). Se borra `StatusBanner`.
  - Aceptación:
    - Los textos con hora y edad se actualizan como hoy; el botón ocupado no pierde el foco.
    - Sigue habiendo un solo aviso por causa (`web-error-states`).
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/data-freshness src/widgets/station-list src/widgets/app-header src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `shared/ui/data-freshness/{StaleNotice,UpdatedIndicator}.tsx` (+ tests), `pages/map/ui/{OfflineNotice,MobileSheetHeader}.tsx`, `shared/ui/status-banner/*`, `shared/ui/index.ts`.
  - Dependencias: T9.

#### Checkpoint PR 4
- [x] Resto de `check:task` en verde y avisos explicados.
- [x] Revisión visual del usuario del buscador, el selector y los avisos en cada estado, a 1440 y 390 px.
- [ ] Permiso para push, PR y merge.

### PR 5: Mapa (`feat/web-ui-migration-5-map`)

- [x] **T11: puntos con `drawMapPoint`** (M, ~1 h 30 min)
  - Descripción: `toMapPoints` da a cada punto los parámetros de `MapPoint` (`tone` con `availabilityTone`, `value` con `availabilityLabel`, `selected`) y pierde `TONE_BY_LEVEL`. `points.ts` cambia su tipo `MapPoint` y las capas piden `icon-image` con `mapPointImageId`; la imagen que falta se dibuja en `styleimagemissing` con `drawMapPoint`, tras esperar a `mapPointValueFont(style)`. `mapColors.ts` se queda solo con los colores de la posición del usuario (supuesto 7). Se borran `pointImage.ts` y el `MapPointTone` viejo; `shared/ui/index.ts` exporta el de la librería.
  - Aceptación:
    - Halo de 2 px, anillo de 4 px, cifra de 15 px, `muted` sin halo y `danger` continuo (supuesto 3); el elegido va encima (`symbol-sort-key`).
    - Los tests de capas y de `toMapPoints` cubren los cinco niveles, el elegido y el registro de la imagen sobre un pintor falso.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map src/widgets/stations-map src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `widgets/stations-map/lib/toMapPoints{,.test}.ts`, `shared/ui/base-map/{points,mapLayers,mapColors,pointImage,useMapLibre,index}.ts` (+ tests), `shared/ui/index.ts`.
  - Dependencias: PR 4 mergeado.

- [ ] **T12: posición del usuario** (S, ~45 min)
  - Descripción: la capa de la posición pasa a relleno de 12 px y borde blanco de 2, y gana una capa de halo de 22 px al 18 % debajo (supuesto 3). Las dos siguen en `base-map`.
  - Aceptación: test de las dos capas (radio, borde, color, opacidad y orden).
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map`; `pnpm check:task`.
  - Archivos: `shared/ui/base-map/{points,mapLayers}.ts` (+ tests).
  - Dependencias: T11.

- [ ] **T13: controles del mapa y `MapNotice`** (M, ~1 h 15 min)
  - Descripción: `MapControls` se sustituye: el zoom es un `ControlGroup` con dos `IconButton` («Acercar», «Alejar») y centrar, un `IconButton` `floating` `md` con `iconTone="primary"` aparte, como en el lienzo de escritorio. `RecenterButton` (móvil) monta `IconButton` `floating` `lg`, `iconTone="primary"`, `iconSize={22}` y sigue su posición sobre el panel. `MapNotice` pasa a `tone-*`, cambia `OfflineIcon` por `Icon name="wifi-off"` y su leyenda de «sin confirmar» a `Legend`. Se borra `MapControls`.
  - Aceptación: los nombres, `aria-busy`/`aria-disabled` de centrar y su posición sobre el panel no cambian; el aviso de servicio y la capa sin conexión dicen lo mismo.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map src/widgets/stations-map src/pages/map`; floor guard y resto de `check:task`.
  - Archivos: `shared/ui/base-map/{BaseMap,MapControls}.tsx` (+ tests), `pages/map/ui/RecenterButton{,.test}.tsx`, `widgets/stations-map/ui/MapNotice.tsx`, `widgets/stations-map/ui/StationsMap.test.tsx`.
  - Dependencias: T12.

#### Checkpoint PR 5
- [ ] Resto de `check:task` en verde y avisos explicados.
- [ ] Revisión visual del usuario del mapa (puntos, elegido, posición, controles, avisos) a 1440 y 390 px.
- [ ] Permiso para push, PR y merge.

### PR 6: Retirada (`feat/web-ui-migration-6-cleanup`)

- [ ] **T14: iconos y tokens viejos, con su test** (S, ~1 h)
  - Descripción: borrar `icons.tsx` e `IconFrame`, los tokens `availability-*` y `notice-*` y `text-sheet-subtitle` de `index.css`, y añadir el test de retirada, que busca en `web/src` esas clases y variables (supuesto 7).
  - Aceptación: el test falla si se añade una clase `bg-availability-good` y pasa sin ella; `pnpm --filter web build` sin errores; ningún archivo importa los iconos viejos.
  - Verificación: `pnpm --filter web exec vitest run src/app src/shared`; `pnpm --filter web build`; floor guard y resto de `check:task`.
  - Archivos: `shared/ui/icons/{icons.tsx,IconFrame.tsx,index.ts}` (+ tests), `shared/ui/index.ts`, `app/styles/index.css`, un test de retirada en `app/styles`.
  - Dependencias: PR 5 mergeado.

- [ ] **T15: sin `/dev/components` y cierre** (S, ~45 min)
  - Descripción: borrar `pages/dev-components`, su ruta solo de desarrollo y su test en `app/router.tsx`. Comprobar que el build no la incluye, repasar SC1 a SC5 y dejar al día este plan y la spec.
  - Aceptación: la ruta no existe ni en desarrollo; SC1 a SC5 comprobados y apuntados.
  - Verificación: `pnpm --filter web build`; floor guard y resto de `check:task`.
  - Archivos: `pages/dev-components/*`, `app/router.tsx` (+ test), spec, este plan.
  - Dependencias: T14.

### Checkpoint final
- [ ] SC1 a SC5 comprobados; CI en verde en el PR 6.
- [ ] Revisión visual del usuario de las dos pantallas en cada estado, a 1440 y 390 px (SC6).
- [ ] Permiso para mergear el PR 6 y, después, el PR de release (web 0.11.0); comprobación en Render.
- [ ] Un PR `docs` pasa spec, plan y capability map a **implemented**.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Un test de pantalla reescrito pierde una comprobación de comportamiento | Alto | Solo cambian las aserciones de aspecto; cada aviso del floor guard se explica en el commit; antes de borrar un test viejo se apunta dónde queda probado |
| Un estado de `web-error-states` cambia su región viva o anuncia dos veces | Alto | Cada tarea comprueba `<output>`, `role="alert"` y su ausencia en los mismos tests de hoy |
| El mapa deja de dibujar puntos al cambiar el registro de imágenes | Medio | T11 prueba el registro en `styleimagemissing` con un pintor falso y se mira en el navegador antes del merge |
| La cifra del punto se dibuja con la fuente de reserva | Bajo | Esperar a `mapPointValueFont(style)` antes de dibujar, con test |
| Un cambio de web ajeno al módulo entra en la release mientras el PR de release espera | Bajo | El PR de release no se mergea sin permiso; se revisa su changelog antes |
| Una pantalla necesita un parámetro que la librería no tiene | Medio | Se pregunta antes de tocar `shared/ui` (Boundaries de la spec) |

## Preguntas abiertas

Ninguna. El PR 1 es `refactor(web)` (decisión del usuario, 2026-11-11), porque no cambia nada a la vista.

## Estimación

Unas 16 h en total: PR 1 ~1 h, PR 2 ~4 h, PR 3 ~3 h, PR 4 ~3 h 30 min, PR 5 ~3 h 30 min, PR 6 ~1 h 45 min, sin contar la revisión visual de cada PR.

## Changelog

- 2026-11-11: borrador a partir de la spec aprobada.
- 2026-11-11: aprobado por el usuario, con el PR 1 como `refactor(web)`.
- 2026-11-11: T1 hecha (con el agente `frontend-developer`). `availabilityTone()` en `entities/station/model/availability.ts`, con su tabla `satisfies Record<AvailabilityLevel, …>` y el tipo de vuelta sin `inverse` (comprobado con `expectTypeOf`); todavía no la usa nadie. `ResultList` y `BottomSheet` tenían el anillo por dentro (`-outline-offset-2`), así que pasan a `focus-ring [--focus-ring-offset:-2px]`; `StationSection` a `focus-ring`. El anillo se ve igual y ningún test miraba sus clases. 6 tests nuevos; `pnpm check:task` en verde (1689 tests en web, floor guard limpio).
- 2026-11-11: T2 hecha. `arrow-left` sale de `ICON_NAMES` y de `iconDrawings.ts`; la librería queda con 20 nombres y un `expectTypeOf` comprueba que `arrow-left` ya no es un `IconName`. `/dev/components` no lo nombraba (recorre `ICON_NAMES`). El floor guard avisa de 1 aserción reescrita: `toHaveLength(21)` pasa a `toHaveLength(20)`, que sigue fijando el número exacto de nombres. El resto de `check:task` en verde por separado (tipos, lint, secretos, tests de scripts, 1684 tests en web, api, 100 % de líneas cambiadas y depcruise); son 5 tests menos, los casos de `arrow-left` de los `it.each`.
- 2026-11-12: T3 hecha (con el agente `frontend-developer`). `StationRows` monta `ListItem` con el número (`leadingText`), el nombre, la distancia y el paseo, un `CountBadge` `md` (32 px en todos los anchos; hoy 30 en móvil) con `availabilityTone` y la etiqueta de estado (`trailingCaption`); el nombre accesible es el de hoy, ahora en `rowLabel()` dentro del widget. `entities/station` exporta los textos y formatos que usa. `ListItem` no pasa atributos `data-*`, así que `data-station-number` pasa al `<li>` y `findRow` devuelve su botón: el foco sigue volviendo al botón de la fila. Como en el lienzo, las filas van separadas por 2 px y sin líneas (`gap-0.5`, antes `divide-y`), y miden 64 px (`ListItem`). El hover es `chip`, como pide el documento; el lienzo usa `#f1f5fa`, casi igual, y el cuadro del número se funde un poco con la fila al pasar el ratón, en los dos. `StationRow` se borra; sus 14 comprobaciones quedan cubiertas en `StationList.test.tsx` (6 tests nuevos y el de la separación) y en los de `ListItem` y `CountBadge`, salvo dos que ya no aplican: el hover distinto de `chip` (ahora es `chip`, buscado) y el paso de `ref` (nadie lo usaba). El floor guard avisa de 2: `StationRow.test.tsx` borrado y la aserción de «tags each row», que comprueba el atributo en el `<li>` en vez de en el botón. El resto de `check:task` en verde por separado (1677 tests en web, 100 % de 12 líneas cambiadas, depcruise sin violaciones).
- 2026-11-12: T4 hecha (con el agente `frontend-developer`). `FavoriteStations` guarda el estado con `useLocalStorage` (misma clave, `parseOpen` movido desde `CollapsibleSection`, abierta por defecto) y monta `Disclosure` controlada con `star-filled`; el nombre «Favoritas · N», el estado tras recargar, `data-station-list` y el `h3` en móvil siguen con sus tests sin cambios. `AvailabilityLegend` monta `Legend` («Leyenda») y conserva el `h2` oculto, así que la página tiene los mismos encabezados. `CollapsibleSection` se borra; sus 7 comprobaciones quedan en `StationList.test.tsx` (3 tests nuevos: encabezado enfocable, estrella rellena de 18 px con chevron que gira, estado guardado no válido) y en los de `Disclosure`. A la vista: estrella rellena de 18 px, título en negrita con «· N» en gris de 13 px, 4 px entre encabezado y filas; la leyenda pasa a 13 px y «Vacía» a blanco con borde rojo discontinuo de 2 px. El floor guard avisa de 6 en esta tarea: `CollapsibleSection.test.tsx` borrado y 5 aserciones de clase de la leyenda que pasan de `availability-*` a `tone-*` (mismas comprobaciones, clases nuevas). El resto de `check:task` en verde por separado (1670 tests en web, 100 % de 14 líneas cambiadas, depcruise sin violaciones).
- 2026-11-12: T5 hecha (con el agente `frontend-developer`). Los avisos de ubicación montan `Banner` `info` con `pin` (el del lienzo de escritorio) y su acción como `Button` `sm` ocupado; siguen siendo `polite` como hoy (el plan decía «ninguna», pero hoy ya son `status` y un test de la página lo espera), y ahora la acción queda fuera de la región viva, como pide la librería. El bloque de error y sin conexión monta `EmptyState` `alert` con `cloud-alert` (el icono de los tableros de error, no el triángulo de hoy) o `wifi-off`, «Reintentar» grande con `refresh` y ocupado (`usePendingAction` en un `BlockingState`), y la cuenta atrás como `children` con su `aria-live="off"` de hoy (`note` no lo lleva y su test se habría reescrito). «Cargando…» y «Ninguna estación en N m» no caben en `EmptyState` (pide mensaje e icono grande y ningún texto puede cambiar): son un `<output>` del widget, con `aria-busy` y `Spinner` al cargar. `StationSection` pasa a 16/700 con su leyenda en `text-meta`, en la misma línea en escritorio como en el lienzo. Para la revisión visual: el lienzo móvil dibuja el aviso «Sin tu ubicación» sin icono y el código lo pinta con `pin`. 9 tests nuevos, ninguna aserción reescrita; el floor guard no suma avisos (siguen los 8 de T3 y T4). El resto de `check:task` en verde por separado (1678 tests en web, 100 % de 24 líneas cambiadas, depcruise sin violaciones).
- 2026-11-12: revisión visual del PR 2 aprobada por el usuario; se quedan como están el `pin` del aviso móvil «Sin tu ubicación» y el hover `chip` de las filas.
- 2026-11-12: T6 hecha (con el agente `frontend-developer`). La ficha de escritorio es un `Card` `float` dentro de un `div` que la coloca, con «Cerrar» en `cornerActions` y la estrella en `titleAction`. La cabecera del panel móvil es un `Card` `flat` como `div`, porque el `BottomSheet` pone cabecera y cuerpo en huecos distintos y un solo `Card` no puede envolver los dos. Lleva «Volver a la lista» (`chevron-left`, 22 px, `primary`) en `leadingAction`, y el cuerpo sigue cerrando con Escape por su cuenta. `Card.Header` gana `titleRef` (opcional, con test) para que la página siga moviendo el foco al título. `StationMeta` pasa a `useStationMeta()`, que da el texto de `meta` en `text-meta`. `FavoriteButton` es un solo `IconButton` (`star`/`star-filled`, 24 px como hoy, «Favorita» con tooltip y `aria-pressed`). Su variante de texto se borra porque nadie la usaba. Se borran `CardHeader`, `SheetCardHeader`, `StationMeta`, `ArrowLeftIcon`, `StarIcon` y el alias `CloseIcon`, que se quedan sin uso. El orden de Tab no cambia. El lector de pantalla recorre la ficha de escritorio en el orden de `Card.Header` (meta, «Cerrar», título, estrella), aceptado por el usuario. El título enfocado por código ya no muestra anillo, como pide la spec de la librería. El floor guard avisa de 10 aserciones, cada una con su sustituta: 4 en `FavoriteButton` (glifo ☆, `className` y 2 × `fill-current`, ahora `aria-hidden` y `fill` del svg) y 6 de clases de la rejilla vieja en las fichas, ahora comprobaciones de estructura. El resto de `check:task` en verde por separado (1677 tests en web, depcruise sin violaciones).
- 2026-11-12: T7 hecha (con el agente `frontend-developer`). `CardAvailability` monta dos `StatTile` dentro del mismo `dl`, con `availabilityTone`, la etiqueta de estado y un `srText` de `availabilitySpokenText()` (nueva en `entities/station`, sacada del badge), así que el lector oye lo mismo que hoy. La caja vacía es blanca con borde rojo discontinuo; la sin confirmar, gris. «Cargando» pasa a `Card.Body` `busy` con spinner y el texto oculto, sin `role=status` (aceptado: la región era `aria-busy` desde el inicio y no se anunciaba). El error de carga es un `Banner` `danger` con `cloud-alert` y `assertive`. «Reintentar» va ocupado con `usePendingAction` y queda fuera del `alert`, como en T5 (aceptado). «No encontrada» sigue con su texto en un `alert`, en 15 px `text-fg-muted` como en el tablero, y «Volver a la lista» pasa a `Button` primario. «Fuera de servicio» sigue como `<output>` del widget con el título en `tone-neutral-label`. El tablero lo dibuja oscuro con un círculo tachado, pero `Banner` no tiene tono neutro ni ese icono existe (aceptado). La palabra de estado va en todas las cajas, porque ningún texto puede cambiar (aceptado). Se borran `AvailabilityBadge`, `ErrorState` y `StateMessage`, cada aserción suya con su cobertura nueva: textos de `entities/station`, tests de `StatTile`, `Banner`, `EmptyState` y `Card.Body`, y unos 12 tests nuevos de la ficha. `availability-off-label` y `notice-error*` quedan solo en `index.css` y se retiran en T14. El floor guard suma 7 avisos: los 3 tests borrados y 4 aserciones de la maquetación vieja que ahora miran la caja y el `dl`, o encuentran «Reintentar» fuera del `alert`. El resto de `check:task` en verde por separado (1651 tests en web, 100 % de 17 líneas cambiadas, depcruise sin violaciones).
- 2026-11-12: revisión visual del PR 3 aprobada por el usuario.
- 2026-11-12: T8 necesita ampliar la librería (decisión del usuario). `SearchField` gana `ref`, `onKeyDown`, un `aria-describedby` extra, `inputMode="text"` y una pista que se oculta solo a la vista. El `status` de `EmptyState` envuelve el título y el mensaje, y su texto lleva un `id`. Va como commit previo de T8, en el PR 4 (unos 45 min más). «Prueba con» pasa de h2 a h3, como en el diseño. El icono sigue siendo `search` y los textos no cambian.
- 2026-11-12: T8 hecha (con el agente `frontend-developer`), en dos commits: primero la librería, después la pantalla. `SearchInput` monta `SearchField`. En escritorio es `box` de 48 px. En móvil es `pill` de 44 px con `shadow-pill`, etiqueta y pista ocultas a la vista. Usa `inputMode="text"` y el `IconButton` de borrar de la librería. Muestra un spinner solo mientras una búsqueda escrita espera los datos (decisión del usuario: los tableros no lo dibujan con la caja vacía). `useResultsKeyboard` pierde su rama de Escape en la caja, porque ahora la hace `SearchField`; las flechas, Enter y Escape desde un resultado no cambian. `NoResults` monta `EmptyState` `neutral` `sm` con `search`, `announce="status"` y `messageId`, y la caja sigue descrita por la ayuda y el mensaje. «Prueba con» pasa a h3 y las sugerencias usan `focus-ring`. Se borra `ClearIcon`. Aceptado por el usuario: en escritorio el bloque pierde su borde, como en el tablero, y en móvil sigue en el desplegable bajo la píldora, aunque el tablero lo pone en el panel (pendiente para más adelante). También aceptado: queda `sm` en las dos pantallas porque `EmptyState` no tiene el círculo de 56 px del tablero móvil, hay un h2 dentro del `<output>` (axe y lint pasan) y el espacio entre título y mensaje va solo en `status`. Textos, nombres, anuncio y teclado no cambian. El floor guard suma 4 avisos: 2 en la librería (ya explicados) y 2 de la pantalla, «Prueba con» de nivel 2 a 3 y `shadow-float` a `shadow-pill`. El resto de `check:task` en verde por separado (1664 tests en web, 100 % de 20 líneas cambiadas, depcruise sin violaciones).
- 2026-11-12: T9 hecha (con el agente `frontend-developer`). `NeedToggle` monta `SegmentedControl` con la etiqueta «¿Qué quieres hacer?» oculta, como pide el supuesto 4, aunque el tablero `Main` la muestra. En escritorio son tarjetas de 56 px con `bike`/`dock` de 22 px y la descripción en `text-caption` por `aria-describedby`. En móvil es una píldora blanca con `shadow-pill` y la opción elegida en `soft` (azul suave con anillo), como en los tableros, sin iconos ni descripción, como hoy. `MobileMapPage` quita la sombra y las esquinas de su envoltorio, porque la píldora ya las dibuja. El grupo se nombra con `aria-label` en lugar de `legend`, con el mismo nombre. Pulsar la opción ya elegida ya no navega. Lo acepta el usuario. Se borran `BikeIcon` y `DockIcon`, que quedan sin uso. El teclado, `aria-pressed` y los nombres no cambian. Solo se añaden tests y no se reescribe ninguna aserción; el floor guard no suma avisos. El resto de `check:task` en verde por separado (1666 tests en web, 100 % de 21 líneas cambiadas, depcruise sin violaciones).
- 2026-11-12: T10 hecha (con el agente `frontend-developer`). `StaleNotice` monta `Banner` `warning` con `clock`, como en los tableros (antes el triángulo), y `announce="polite"`. Su «Reintentar» va ocupado fuera de la región viva, como en T5 y T7, y se mantiene también en escritorio, como pide `web-error-states`, aunque `DeskErrorStale` no lo dibuja. `OfflineBar` y `OfflineBanner` montan `Banner` `inverse` (`bar` y `card`) con `wifi-off` y `assertive`. `UpdatedIndicator` monta `StatusText` con su tabla de tonos y un `Button` `sm` `secondary`, porque la librería no tiene el borde gris de los tableros. El texto pierde el `<time dateTime>`, ya que `StatusText` solo admite texto; se ve y se lee igual. El botón ocupado ignora un segundo toque. `MobileSheetHeader` pasa a `text-meta` y `tone-warning-soft-foreground`. Se borran `StatusBanner`, `WarningIcon`, `InfoIcon` y `RefreshIcon`, que quedan sin uso; `ChevronIcon` ya no se usaba antes y queda para T14. Todo aceptado por el usuario. Sigue habiendo un aviso por causa, y los textos, las regiones vivas y los nombres no cambian. El floor guard suma 5 avisos: `StatusBanner.test.tsx` borrado, con su cobertura en `Banner`, `Button` y los tests nuevos de las pantallas; 3 aserciones que buscan «Reintentar» junto al texto vivo y no dentro; y `aria-busy="false"`, que pasa a ser la ausencia del atributo. El resto de `check:task` en verde por separado (1660 tests en web, 100 % de 35 líneas cambiadas, depcruise sin violaciones).
- 2026-11-12: revisión visual del PR 4 aprobada por el usuario.
- 2026-11-12: T11 hecha (con el agente `frontend-developer`). `toMapPoints` da a cada punto `tone` (`availabilityTone`) y `value` (`availabilityLabel`), y desaparece `TONE_BY_LEVEL`. `MapPoint` pasa a ser posición, id y `MapPointParams`. Cada feature lleva su `imageId` (`mapPointImageId`) y la capa pide `['get','imageId']`. El elegido sigue encima con `symbol-sort-key`. Las imágenes se dibujan con `drawMapPoint` a la densidad del dispositivo, con máximo 2. Se espera una sola vez a `mapPointValueFont`, así que cada punto se pinta una vez con la fuente buena; si la fuente falla, se usa la de reserva. Antes se pintaba con la de reserva y se repintaba con `updateImage`. Decisiones del usuario: (1) las imágenes se piden con `setMissingStyleImageResolver` y no con `styleimagemissing`, que el #101 cambió porque el punto recién elegido desaparecía hasta hacer zoom; (2) `selected` se queda en `BaseMap` (`selectedId`), así que cambiar la selección no rehace los puntos; (3) las capas guardan una tabla de id de imagen a parámetros (`pointImages.remember`), porque la librería no lee un id de vuelta, y `useMapLibre` devuelve `{ map, pointImages }`. `mapColors` se queda con `userLocation` y `pointStroke`. Se borran `pointImage.ts` y el `MapPointTone` viejo, y `shared/ui` exporta el de la librería. El floor guard suma 25 avisos: `pointImage.test.ts` borrado (cubierto por `drawMapPoint.test.ts` y los tests nuevos de capas); 3 de `mapColors` pasan a `readMapPointStyle`; 8 de repintado y `createPointImage` en `mapLayers` pasan a la espera de la fuente, `drawMapPoint` y `addImage`; 6 del id viejo en `points`; y 7 de `toMapPoints` y `StationsMap` cambian de nombre `label`/nivel a `value`/tono. El resto de `check:task` en verde por separado (1652 tests en web, 100 % de 43 líneas cambiadas, depcruise sin violaciones).
