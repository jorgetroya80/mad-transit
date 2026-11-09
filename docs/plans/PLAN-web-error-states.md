# Plan: web-error-states

- Created: 2026-11-09
- Status: **approved** (2026-11-09)
- Spec: [SPEC-web-error-states.md](../specs/SPEC-web-error-states.md)

## Overview

Dar a los estados de datos de `web-data-state` los textos y pantallas del diseño en escritorio y móvil: `ErrorState` con cuenta atrás real para `error`, su variante de conexión para `offline` sin datos, barra y lista «Últimos datos guardados» para `offline` con datos, avisos `stale` con «Reintentar», búsqueda sin resultados con sugerencias y los estados de la ficha de estación (alternativa A). La composición de las dos pantallas no cambia; solo los avisos y los textos.

## Decisiones de implementación

- **Rama `feat/web-error-states`, un PR y un commit por tarea.** Sin `Co-Authored-By`. El PR toca `web/` y `docs/`. Título `feat(web): show the design's error states`: publica una release de la web. La spec y este plan van en el commit de T1.
- **Primero lo que bloquea** (T1 y T2: sin datos), porque es lo que hoy peor se ve y porque la cuenta atrás es la parte con más riesgo. Después los estados con datos (T3 y T4), la búsqueda (T5) y la ficha (T6).
- **`ErrorState` es genérico** (`shared/ui/error-state`): recibe tono (`error` rojo, `neutral` gris), icono, título, texto, acción opcional y pie opcional. Qué textos usar en cada estado lo decide el widget con un mapa por estado (`BLOCKING_TEXT`, como en la spec), no `shared`.
- **La espera la calcula quien la decide.** `stationQueries.ts` exporta `retryDelayMs(query)` (lo que hoy es `pollInterval`); `useDataStatus` recibe `errorUpdatedAt` e `isFetching` y devuelve `nextRetryAt` y `isRetrying`. Un hook `useCountdown(until)` en `shared/lib` da los segundos que faltan con `useNow(1000)`; el pie de `ErrorState` lo pinta fuera de la región `alert` y con `aria-live="off"`.
- **Un solo origen por aviso.** El estado de la lista lo combina `useCombinedDataStatus` (`widgets/station-list/model`): el peor de las cercanas y la lista completa, con la hora más antigua, para que `stale` salga con cualquiera de las dos (supuesto 7). La cabecera y el mapa siguen leyendo la lista completa, como hoy.
- **El mapa no se desmonta.** La capa de `offline` y el aviso de `error` son hermanos de `BaseMap` dentro de `StationsMap`, con `pointer-events-none` en el aviso; la capa tapa el mapa y lo deja montado (decisión 3).
- **Variantes con la de hoy por defecto** en piezas compartidas (`StatusBanner`, `SearchInput`, `StationCard`), para que los tests que no tocan estos estados sigan pasando sin cambios.

## Grafo de dependencias

```
T1 ErrorState + cuenta atrás (error sin datos en la lista)
   │
   └─► T2 sin datos fuera de la lista: offline sin datos, buscador desactivado, avisos del mapa
          │
          ├─► T3 offline con datos: barra, aviso móvil, «Últimos datos guardados»
          │
          └─► T4 stale: avisos con Reintentar, las dos consultas, subtítulo y leyenda

T5 búsqueda sin resultados        (independiente; tras T2 por SearchInput)
T6 ficha de estación, alternativa A (independiente)
   │
   └─► T7 cierre: axe por estado, lector de pantalla, docs
```

## Task List

### Fase 1: Sin datos

- [x] **T1: `ErrorState` y cuenta atrás real** (M, ~1 h 30 min)
  - Descripción: `shared/ui/error-state/ErrorState.tsx` con tono, icono en círculo, `h2`, texto, «Reintentar» primario de 48 px con `aria-busy` y pie; `role="alert"` envuelve título y texto, el pie queda fuera con `aria-live="off"`. `retryDelayMs` exportado de `stationQueries`; `useDataStatus` añade `nextRetryAt` e `isRetrying`; `useCountdown` en `shared/lib`. `NearbyStations` sustituye su `StateMessage` `error` por `ErrorState` con los textos de `error` y el pie «Volveremos a intentarlo solos en N s.» (o «Intentándolo de nuevo…»), en las dos pantallas.
  - Aceptación:
    - Con el API caído y sin caché, la lista muestra título, texto, «Reintentar» y la cuenta atrás de 30, 60 y 120 s tras uno, dos y tres fallos (SC1).
    - «Reintentar» pide en el acto, queda `aria-busy` y la cuenta vuelve a 30 s.
    - El pie no está dentro de ninguna región viva; axe sin infracciones.
  - Verificación: `pnpm --filter web exec vitest run src/shared src/entities/station src/widgets/station-list`; `pnpm check:task`.
  - Archivos: `shared/ui/error-state/*`, `shared/lib/time/useCountdown*`, `entities/station/api/stationQueries.ts`, `entities/station/model/useDataStatus*`, `widgets/station-list/ui/NearbyStations.tsx`, spec y este plan.
  - Dependencias: ninguna.

- [x] **T2: Sin datos fuera de la lista** (M, ~1 h 30 min)
  - Descripción: `offline` sin datos usa `ErrorState` tono `neutral` con «Sin conexión a internet» y su texto, sin acción ni pie (supuesto 4). `SearchInput` gana `disabled` y `placeholder`; `SearchSource` gana `unavailableText` y `useBicimadSource` lo rellena: «No disponible hasta recuperar los datos» (`error`) o «Disponible al volver a conectarte» (`offline`); con `offline` y datos, el placeholder «Busca entre las estaciones guardadas». `StationsMap`: con `error` sin datos, aviso flotante «Las estaciones aparecerán aquí cuando se recupere el servicio»; con `offline` (con o sin datos), capa opaca con icono y «El mapa no se puede cargar sin conexión», más «Puedes seguir consultando la lista de la izquierda.» / «… de abajo.» solo con datos.
  - Aceptación:
    - `offline` sin datos: bloque gris sin «Reintentar», buscador desactivado con su placeholder, capa sobre el mapa (SC2).
    - `error` sin datos: buscador desactivado y aviso flotante sobre el mapa (SC1).
    - Al volver `online` la capa desaparece y el mapa sigue montado (la instancia de MapLibre no cambia).
  - Verificación: `pnpm --filter web exec vitest run src/features/search-by-number src/widgets src/pages`.
  - Archivos: `widgets/station-list/ui/NearbyStations.tsx`, `features/search-by-number/{ui/SearchInput.tsx,ui/SearchByNumber.tsx,model/types.ts}`, `widgets/transit-search/model/useBicimadSource.ts`, `widgets/stations-map/ui/{StationsMap.tsx,MapNotice.tsx}`.
  - Dependencias: T1.

### Checkpoint: Sin datos

- [ ] `pnpm check:task` en verde.
- [ ] `dev:mock` a 1440 y 390 px: API bloqueado y recarga (cuenta atrás 30 → 60 → 120 s); «Offline» sin caché (borrar `localStorage`).
- [ ] Revisión del usuario antes de seguir.

### Fase 2: Con datos

- [x] **T3: `offline` con datos** (M, ~1 h 15 min)
  - Descripción: escritorio, barra `notice-offline` a todo el ancho entre `AppHeader` y `main`, `role="alert"`, con «**Sin conexión a internet.** Mostramos los últimos datos guardados; se actualizará solo al volver a conectarte.»; móvil, `StatusBanner` `offline` bajo el modo con «**Sin conexión a internet.** Se actualizará solo al volver a conectarte.». El «Sin conexión» del panel desaparece. Encabezado de cercanas «Últimos datos guardados» con el pie «De las 10:42 · pueden no estar al día»; en móvil, `h2` de la cabecera y franja «Mostrar lista · Últimos datos guardados». `formatClock` (24 h local) en `shared/lib`.
  - Aceptación:
    - Escritorio y móvil muestran el aviso oscuro una sola vez y la lista guardada con su hora (SC4).
    - Al volver la conexión desaparecen barra, aviso y capa, y vuelve el encabezado normal.
  - Verificación: `pnpm --filter web exec vitest run src/pages src/widgets/station-list src/shared`.
  - Archivos: `pages/map/ui/{DesktopMapPage,MobileMapPage,MobileSheetHeader,SheetStripLabel}.tsx`, `pages/map/model/useNearbyTitle.ts`, `widgets/station-list/ui/StationList.tsx`, `shared/lib/time/formatClock*`, `shared/ui/status-banner/StatusBanner.tsx` (variante de ancho completo).
  - Dependencias: T2.

- [x] **T4: `stale` con «Reintentar»** (M, ~1 h 15 min)
  - Descripción: `useCombinedDataStatus` (supuesto 7). `StaleNotice` gana `layout`: escritorio «**No hemos podido actualizar.** Mostramos los datos de las 10:42; puede que ya no sean exactos.», móvil «**Datos de hace 12 min.** No hemos podido actualizar; puede que ya no sean exactos.», los dos con la acción «Reintentar» (`isPending` mientras pide). Subtítulo móvil «Última actualización: 10:42 · hace 12 min» en `notice-stale-foreground`. Leyenda flotante «Gris = dato sin confirmar» en el mapa de escritorio con `stale` u `offline` con datos, `aria-hidden`.
  - Aceptación:
    - El aviso sale con solo la lista completa `stale` y con solo las cercanas, con la hora más antigua (SC3).
    - «Reintentar» relanza las dos consultas y queda ocupado mientras piden.
    - La leyenda no tapa la atribución ni `MapControls`.
  - Verificación: `pnpm --filter web exec vitest run src/widgets src/pages src/shared/ui/data-freshness`.
  - Archivos: `widgets/station-list/model/useCombinedDataStatus*`, `widgets/station-list/ui/StationList.tsx`, `shared/ui/data-freshness/StaleNotice.tsx`, `pages/map/ui/MobileSheetHeader.tsx`, `widgets/stations-map/ui/StationsMap.tsx`.
  - Dependencias: T2 (comparte `StationsMap` y `StationList`).

### Checkpoint: Con datos

- [ ] `pnpm check:task` en verde.
- [ ] `dev:mock`: API bloqueado con datos (`stale` en los dos tamaños) y «Offline» con datos.
- [ ] Revisión del usuario antes de seguir.

### Fase 3: Búsqueda y ficha

- [x] **T5: Búsqueda sin resultados** (M, ~1 h)
  - Descripción: en el desplegable, `NoResults` con `role="status"`: «No hay ninguna estación «999»», «Revisa el número que aparece en la estación.», `h3` «Prueba con» y dos botones de 44 px: la sugerencia («33 · Puerta del Sol», elige como un resultado) y «Ver estaciones cercanas» (borra la búsqueda y deja el foco en el buscador). `SearchSource` gana `suggestion?: SearchItem`; `useBicimadSource` la toma de la primera cercana. El input lleva `aria-describedby` a la ayuda y al bloque. `searchStatusText` deja de anunciar el «ninguna» (lo dice el bloque).
  - Aceptación:
    - «999» muestra mensaje, sugerencia y «Ver estaciones cercanas»; sin cercanas, solo el segundo botón (SC5).
    - Elegir la sugerencia abre la estación; «Ver estaciones cercanas» borra y enfoca el buscador.
    - Flechas y Escape del desplegable siguen como hoy; axe sin infracciones.
  - Verificación: `pnpm --filter web exec vitest run src/features/search-by-number src/widgets/transit-search`.
  - Archivos: `features/search-by-number/{ui/NoResults.tsx,ui/SearchByNumber.tsx,lib/searchStatusText.ts,model/types.ts}`, `widgets/transit-search/model/useBicimadSource.ts`.
  - Dependencias: T2 (toca `SearchByNumber` y `types.ts`).

- [ ] **T6: Ficha de estación, alternativa A** (M, ~1 h 15 min)
  - Descripción: en `CardBody` y el detalle del panel: fuera de servicio, aviso `role="status"` «Fuera de servicio» con «No se pueden sacar ni dejar bicis.» en lugar de las insignias y pie «Actualizado hace N s»; sin confirmar, pie «Último dato: 10:42 · hace 12 min»; no encontrada, meta «Estación 999», título «Estación no encontrada», sin estrella, cuerpo `role="alert"` con su texto y «Volver a la lista» (llama al cierre de la tarjeta o al volver del panel), sin pie; error de carga, «No se pudo cargar la estación», «El servicio de BiciMAD no está respondiendo. Suele ser temporal.» y «Reintentar», sin pie.
  - Aceptación:
    - Los cuatro estados, en la tarjeta de escritorio y en el panel móvil (SC6).
    - «Volver a la lista» devuelve el foco como «Cerrar» y la flecha (`useListFocusReturn`).
    - axe sin infracciones en cada estado.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/station-card src/pages`.
  - Archivos: `widgets/station-card/ui/{CardBody,CardHeader,SheetCardHeader,StationMeta,StationCard,StationSheet}.tsx` y sus tests.
  - Dependencias: ninguna (tras T3 por `formatClock`).

- [ ] **T7: Cierre** (S, ~45 min)
  - Descripción: test de axe por cada fila de la tabla «Estados y pantallas» en las dos pantallas; comprobar que ningún estado anuncia dos avisos (un `alert` o `status` por causa); repaso de textos contra la spec; VoiceOver en `dev:mock`.
  - Aceptación:
    - SC7: axe sin infracciones en cada estado; VoiceOver anuncia cada aviso una vez y no lee la cuenta atrás.
    - SC8: `pnpm check:task` en verde.
  - Verificación: `pnpm check:task`; VoiceOver manual.
  - Archivos: `pages/map/ui/{DesktopMapPage,MobileMapPage}.test.tsx`, este plan.
  - Dependencias: T1-T6.

### Checkpoint final

- [ ] SC1-SC8 comprobados; CI en verde.
- [ ] Pedir permiso antes de push, abrir el PR y hacer merge.
- [ ] Después del despliegue: comprobar en Render con el modo avión en un móvil; marcar spec, plan y capability map como **implemented**.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| La cuenta atrás no coincide con el reintento real (el intervalo de TanStack se reinicia con cada actualización de la consulta) | Alto | `nextRetryAt` sale de la misma `retryDelayMs` que usa `refetchInterval`; test con temporizadores falsos que compara el pie con la petición real de MSW |
| La cuenta atrás se lee en bucle con lector de pantalla | Medio | Pie fuera de la región `alert`, `aria-live="off"`; comprobación con VoiceOver en T7 |
| La capa offline desmonta o reinicia MapLibre | Medio | Capa hermana de `BaseMap`; test que comprueba la misma instancia al volver `online` |
| Dos avisos para la misma causa (barra y panel, o `ErrorState` y aviso oscuro) | Medio | Un aviso por causa en la tabla de la spec; test de roles por estado en T7 |
| Variantes nuevas rompen escritorio o móvil | Medio | Variante de hoy por defecto; los tests que no tocan estos estados no cambian |
| Desactivar el buscador con texto escrito | Bajo | Solo se desactiva sin datos (arranque); con datos sigue activo en todos los estados |

## Paralelización

T5 y T6 no dependen de T3 y T4 y no comparten archivos con ellos; podrían ir en paralelo tras T2. Con un solo PR y un commit por tarea se hacen en serie.

## Estimación

Unas 8 h 30 min en total. Fase 1 ~3 h, fase 2 ~2 h 30 min y fase 3 ~3 h.

## Changelog

- 2026-11-09: borrador a partir de la spec aprobada.
- 2026-11-09: aprobado por el usuario.
- 2026-11-09: T1 hecha. `ErrorState` en `shared/ui/error-state` con los tonos `error` y `neutral` (este listo para T2); el pie queda fuera del `alert` con `aria-live="off"`. `retryDelayMs` no se exporta: el Proxy de `useRestartingRefetch` añade `retryDelayMs` al resultado de cada consulta, calculado con la misma función que `refetchInterval`, y `useDataStatus` lo lee como los demás campos; devuelve `nextRetryAt` e `isRetrying`. Cambio de comportamiento: al reintentar sin datos TanStack vuelve a `pending`, así que `useDataStatus` da la petición por fallida si `isError` o si `errorUpdatedAt > dataUpdatedAt`; durante el reintento la lista, la cabecera y el buscador siguen en error en lugar de «Cargando…». `useCountdown` en `shared/lib`, y `usePendingAction` sacado de `RetryButton` para compartirlo con `ErrorState`. El pie de la cuenta atrás se monta con `key` en `nextRetryAt` para que cada fallo reinicie el reloj. `offline` sin datos sigue con el bloque de `error` y «Reintentar», sin pie, hasta T2. El floor guard avisa de 3 aserciones reescritas en `StationList.test.tsx` (título viejo y «Reintentar», que ya no está dentro del `alert`). 788 tests en web; `check:task` en verde salvo ese aviso.
- 2026-11-09: T2 hecha. `offline` sin datos con `ErrorState` tono `neutral`, `OfflineIcon`, sin acción ni pie. `SearchSource` gana `unavailableText` (desactiva el buscador y sustituye placeholder y ayuda; la ayuda queda solo para lectores) y `placeholder` («Busca entre las estaciones guardadas» con `offline` y datos); sin botón de borrar mientras está desactivado. `MapNotice` en `widgets/stations-map`: aviso flotante no vivo con `error` y capa opaca `bg-canvas` en un `<output>` con `offline` (no hay token `surface-muted`); en móvil empiezan a `top-40`, bajo buscador y modo. `StationsMap` gana `layout` obligatorio y envuelve `BaseMap` y `MapNotice` en una caja `relative isolate`, así la capa no tapa el panel móvil ni la tarjeta de escritorio; sí tapa `MapControls`. El floor guard avisa de 5 aserciones reescritas nuevas: `DesktopMapPage.test.tsx` (la tarjeta está en el abuelo del mapa por la caja nueva) y 4 de `TransitSearch.test.tsx` (ya no se puede escribir en el buscador sin datos; ahora comprueban que está desactivado con su placeholder). 805 tests en web; `check:task` en verde salvo ese aviso.
- 2026-11-09: T3 hecha. La barra de escritorio y el aviso móvil (`pages/map/ui/OfflineNotice.tsx`) salen con `isSaved` de la lista de cercanas (sin conexión y con datos), no con la lista completa: así siempre hay un solo aviso, el bloque de la lista o la barra. `StatusBanner` gana `shape` (`card` por defecto, `bar` a todo el ancho). `formatClock` (24 h, es-ES) en `shared/lib`; título y pie de la lista guardada en `widgets/station-list/lib/savedList.ts`, compartidos por el panel y la cabecera móvil. En escritorio la lista guardada oculta «Actualizado hace…», que repetiría la hora; en móvil cambian el `h2` de la cabecera, su subtítulo y la franja, y el `h3` «Cercanas» se queda. La capa offline del mapa móvil baja a `pt-60` para no quedar bajo el aviso. `MobileMapPage` saca `FloatingControls` por `max-lines-per-function`. El floor guard avisa de 7 aserciones reescritas nuevas: una de `useNearbyAvailability` (gana `isSaved: false`), 4 del «Sin conexión» del panel, que se quita a propósito, y 2 que ahora buscan las filas dentro de su región. 821 tests en web; `check:task` en verde salvo ese aviso.
- 2026-11-09: T4 hecha. `useCombinedDataStatus(center, need)` toma el peor estado de cercanas y lista completa (ok < loading < stale < error < offline), la hora más antigua y un «Reintentar» que pide las dos con `Promise.allSettled`; `offline` gana a `stale`, así que la barra de T3 sigue siendo el único aviso sin conexión. `StaleNotice` pasa a recibir `layout`, `updatedAt` y `onRetry` (solo lo usa `StationList`). `formatMinutesAgo` da «hace N min» o «hace menos de 1 min». La leyenda «Gris = dato sin confirmar» sale solo en escritorio con `stale` según el estado de la lista completa, que es la que pinta los puntos; sin conexión no se pinta, porque la capa la taparía. Textos inventados cuando falta la hora (pendientes de confirmar): «No hemos podido actualizar. Puede que los datos ya no sean exactos.», «Datos sin confirmar.» y el subtítulo «Datos sin confirmar». El floor guard avisa de 5 aserciones reescritas nuevas, todas del texto «Sin confirmar: datos de …» que la spec sustituye. 846 tests en web; `check:task` en verde salvo ese aviso.
- 2026-11-09: el usuario aprueba los textos sin hora de T4.
- 2026-11-09: T5 hecha. `NoResults` en `features/search-by-number`: el mensaje va en un `<output>` (solo las dos líneas) y el encabezado «Prueba con» y los botones quedan fuera, para que no se lean en cada tecla. «Prueba con» es `h2` y no `h3`: bajo el `h1` de la página un `h3` incumple `heading-order` de axe (pendiente de confirmar con el usuario). `useBicimadSource(center)` toma la sugerencia de `useNearbyStations` de `entities` con el mismo centro y modo (la misma consulta que la lista, sin petición extra), porque un widget no puede importar otro; `TransitSearch` gana `center` obligatorio. `searchStatusText` ya no anuncia «Ninguna estación…». `SearchByNumber` saca `SearchDropdown` por `max-lines-per-function`. El floor guard avisa de 3 aserciones reescritas nuevas, las de «Ninguna estación con el número…», que ahora comprueban el bloque. 862 tests en web; `check:task` en verde salvo ese aviso.
