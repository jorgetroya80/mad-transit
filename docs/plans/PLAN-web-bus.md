# Plan: web-bus

- Created: 2026-10-30
- Status: **approved** (2026-11-12)
- Spec: [SPEC-web-bus.md](../specs/SPEC-web-bus.md)

## Overview

Selector "BiciMAD / Bus", paradas cercanas con icono de bus en el mapa, popup de resumen, lista, detalle con líneas y llegadas, posición del autobús ("Ver en el mapa") y búsqueda de paradas por número. Arranca con el cliente `@jorgetroya80/mad-transit-client` 0.9.0, que publica [PLAN-api-bus.md](PLAN-api-bus.md) (ya implementado).

## Decisiones de implementación

- **Un PR por fase, un commit por tarea.** Sin `Co-Authored-By`. Cada PR solo toca `web/` y `docs/`. Cada PR se mergea antes de empezar la fase siguiente, con su checkpoint hecho. PRs pequeños para revisar y revertir por partes:
  - PR 0, `refactor(web)`: T0a y T0b. Título `refactor(web): move shared location and retry helpers`.
  - PR 1, `feat(web)`: T1 a T3. Título `feat(web): add bus stop data and map points`.
  - PR 2, `feat(web)`: T4 a T6. Título `feat(web): show bus stops list, detail and arrivals`.
  - PR 3, `feat(web)`: T7 a T10. Título `feat(web): add bus stop popup, vehicle position and search`.
  - Ramas: `refactor/web-shared`, `feat/web-bus-data`, `feat/web-bus-stops`, `feat/web-bus-popup`.
  - **Excepción a AGENTS.md** («una rama y un PR por módulo»): aprobada por el usuario. Los SVG de marca (`chore(web)`, commit `22f7fab`) van en la rama de la fase 0, no en una rama propia; así no quedan en ningún changelog.
- **Subir el cliente es parte de T1**: `web/package.json` y el lockfile, versión exacta `0.9.0`. Va en el mismo PR porque solo toca `web/`.
- **Lo de BiciMAD no cambia de comportamiento.** T2 introduce el selector con BiciMAD como valor por defecto, y los tests de BiciMAD que ya existen tienen que pasar sin tocarlos. La única diferencia visible es que el buscador pierde su propio selector (decisión 5 de la spec).
- **Primero `base-map` (T3) y después los widgets**, porque es la única pieza que toca `maplibre-gl` y su mock.
- **Fase 0 antes que nada**: T0a y T0b mueven piezas de BiciMAD a `shared/` para que los widgets de bus puedan usarlas. Van en un PR `refactor(web)` aparte, antes de la fase 1.
- **Reutilizar lo que ya hay** (la spec lo exige, y lo revisamos contra el código el 2026-11-12):
  - Iconos: `bus`, `pin` y `clock` de `shared/ui/icons`. Sin SVG nuevos.
  - Puntos del mapa: `MapPointParams` de `shared/ui/map-point` (parada = `shape: 'square'`, `icon: 'bus'`). Sin `map.addImage` a mano.
  - Componentes: `ListItem`, `Tag`, `StatusText`, `EmptyState`, `Banner`, `StaleNotice`, `ApproximateLocationNotice`.
  - Reintentos: la pauta de BiciMAD (`retryDelayMs`, `RETRY_DELAYS_MS`, `POLL_INTERVAL_MS` de `shared/config`).
- **Respetar `Retry-After`**: en las queries de bus, un 4xx no se reintenta y un `503` con `Retry-After` (cupo EMT) o un `429` con `Retry-After` (límite del API) no reintentan antes de ese tiempo. Si sirve también para BiciMAD, va en otro PR (`fix(web)`) para no cambiar su comportamiento aquí.

## Grafo de dependencias

```
T1 cliente 0.9.0 + MSW + entities/bus-stop
   │
   ├─► T2 selector de servicio + URL ──┬─► T4 mapa con iconos + lista + ?stop ─► T5 detalle ─► T6 llegadas ─┬─► T7 popup
   │                                   │                                                                    └─► T8 autobús en el mapa
T3 base-map: puntos con icono ─────────┘
   │
   └─► (T7 y T8 usan también popup y fitPoints de base-map)
T2 ─► T9 buscador de paradas
T1-T9 ─► T10 cierre
```

## Task List

### Fase 0: Refactor previo (PR `refactor(web)` aparte)

- [ ] **T0a: Mover piezas compartidas fuera de su widget o página** (S, ~1 h)
  - Descripción: `LocationNotice` pasa a `shared/ui/location-notice` como componente genérico: el copy entra por props (`ApproximateLocationBanner`, `LocatingBanner`) y `shared/ui` no contiene palabras de dominio. El copy de BiciMAD queda en un wrapper en `widgets/station-list/ui/LocationNotice.tsx`. `useMapLocation` y `useUserFocus` pasan de `pages/map/model` a `shared/lib/geo/`; `useMapLocation` usa `GeoPosition` en vez de `Coordinates` de entities (shared no importa entities). Sin cambios de comportamiento en BiciMAD.
  - Aceptación:
    - Los tests de BiciMAD pasan sin cambios de comportamiento (solo cambian sus imports, si los tienen).
    - `pnpm --filter web depcruise` sin violaciones de capa.
  - Verificación: `pnpm --filter web test`; `pnpm --filter web depcruise`.
  - Archivos: `shared/ui/location-notice/*` (+ test), `widgets/station-list/ui/LocationNotice.tsx`, `shared/lib/geo/useMapLocation.ts`, `shared/lib/geo/useUserFocus.ts`, `shared/ui/index.ts`, `shared/lib/index.ts`, imports de `pages/map/ui/*` y `widgets/station-list/ui/StationList.tsx`.
  - Dependencias: ninguna.

- [ ] **T0b: Extraer la pauta de reintentos a `shared`** (S, ~1 h)
  - Descripción: `consecutiveFailures` y `retryDelayMs` de `entities/station/api/stationQueries.ts` a `shared/lib` (o `shared/api`), sin cambios de comportamiento. `entities/bus-stop` lo usará desde T1.
  - Aceptación:
    - Los tests de `stationQueries` pasan sin cambios.
    - `depcruise` sin violaciones (ninguna entidad importa de otra).
  - Verificación: `pnpm --filter web exec vitest run src/entities/station`; `pnpm --filter web depcruise`.
  - Archivos: `entities/station/api/stationQueries.ts`, `shared/lib/...` (nuevo fichero) (+ test).
  - Dependencias: ninguna.

### Checkpoint: Fase 0

- [ ] `pnpm check:task` en verde; PR `refactor(web)` mergeado antes de empezar la fase 1.

### Fase 1: Base

- [ ] **T1: Cliente 0.9.0, fixtures de MSW y `entities/bus-stop`** (M, ~1 h 30 min)
  - Descripción: subir `@jorgetroya80/mad-transit-client` a `0.9.0` (`listBusStops`, `getBusStop`, `getBusStopArrivals`). Handlers de MSW con el mismo patrón que `createHandlers({ updatedAt })` y fixtures de `/v1/bus/stops`, `/v1/bus/stops/{number}` (200 y 404) y `/arrivals` (normal, `noEstimate`, vacía, `503` con `Retry-After` (cupo), `429` con `Retry-After`, `502`). `entities/bus-stop`: query keys; `useNearbyStops` (`staleTime` 1 h, sin `refetchInterval`), `useAllStops` (solo con Bus), `useStop` y `useArrivals` (30 s, sin pestaña oculta, con `retryDelayMs` y `Retry-After`); tipos reexportados del cliente y `formatArrival`.
  - Aceptación:
    - `formatArrival`: "Llegando" con 0, "N min" y "Sin estimación" con `noEstimate`.
    - `useArrivals` no reintenta un `404` ni un 4xx; reintenta un `502` con `RETRY_DELAYS_MS`; con `503` por cupo o `429` y `Retry-After` no pide antes de ese tiempo (test con MSW).
    - `pnpm --filter web typecheck` en verde con el cliente nuevo; no hay tipos del API escritos a mano.
  - Verificación: `pnpm --filter web exec vitest run src/entities/bus-stop`; `pnpm --filter web typecheck`.
  - Archivos: `web/package.json`, `shared/api/mocks/{handlers,fixtures}.ts`, `entities/bus-stop/{api,model,index.ts}`.
  - Dependencias: ninguna (cliente 0.9.0 ya publicado).

- [ ] **T2: Selector de servicio y URL** (M, ~1 h 30 min)
  - Descripción: `features/select-service` (`useService` con `navigate` + `replace` y `ServiceToggle`, un grupo de radios nativo). `mapSearch` añade `service` y `stop`; `router.tsx` pasa a `stripSearchParams` con `need` y `service: 'bicimad'`. Cambiar de servicio quita `?station` o `?stop` y conserva `?need`. `MapPage` elige los widgets según el servicio (con Bus, de momento, un panel vacío "Paradas"). El buscador recibe la fuente activa y `SearchByNumber` no pinta `SourcePicker` con una sola fuente.
  - Aceptación:
    - `/?service=bus&stop=72` se valida; un `service` desconocido vuelve a `bicimad`; `?stop` sin `service=bus` se ignora.
    - Cambiar a Bus y volver deja la URL en `/?need=docks` si `need` era `docks`.
    - Todos los tests de BiciMAD pasan sin cambios, salvo los del `SourcePicker` (decisión 5).
  - Verificación: `pnpm --filter web test`; `pnpm --filter web depcruise`.
  - Archivos: `features/select-service/*`, `pages/map/model/mapSearch.ts` (+ test), `app/router.tsx`, `pages/map/ui/MapPage.tsx`, `widgets/transit-search/ui/TransitSearch.tsx`.
  - Dependencias: T1.

- [ ] **T3: `base-map`: puntos de parada con icono** (M, ~1 h 30 min)
  - Descripción: los puntos de parada son `MapPointParams` de `shared/ui/map-point` (`shape: 'square'`, `icon: 'bus'`); la seleccionada se dibuja más grande. Van en la capa `point-images` que ya existe; `map-point` dibuja las imágenes bajo demanda. No se escriben SVG ni se llama a `map.addImage` a mano. El vehículo queda para T8 (pregunta abierta de la spec).
  - Aceptación:
    - Con puntos de parada, `setData` llena la fuente de `point-images` con su `imageId`.
    - Clic en un punto llama a `onSelectPoint(id)`; el cursor cambia a `pointer`.
    - BiciMAD no cambia: sus tests de `base-map` y `StationsMap` pasan sin tocarlos.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map src/shared/ui/map-point`; `pnpm --filter web depcruise`.
  - Archivos: `shared/ui/base-map/{points.ts,mapLayers.ts,BaseMap.tsx}`, `shared/ui/map-point/mapPointParams.ts` (+ tests).
  - Dependencias: ninguna (en paralelo con T1 y T2).

### Checkpoint: Fase 1

- [ ] `pnpm check:task` en verde; cobertura por capa ≥ 80 %.
- [ ] `pnpm --filter web dev:mock`: BiciMAD igual que antes; el selector cambia la URL.

### Fase 2: Paradas

- [ ] **T4: Mapa de paradas, lista, sin ubicación y `?stop`** (M, ~2 h)
  - Descripción: `features/select-stop` (`useSelectedStop`, `navigate` + `push`). `widgets/bus-stops-map`: paradas cercanas como puntos de parada, más la seleccionada si está fuera de los 500 m (con `useStop`); foco en la seleccionada (`useUserFocus`). `widgets/bus-stop-list`: "Paradas cercanas", por distancia, con `ListItem` (número, nombre, líneas como `Tag`, distancia) y los estados cargando, vacío ("Ninguna parada a 500 m"), error y `stale`. Sin ubicación: `useMapLocation` (centro en Sol) y `ApproximateLocationNotice`; en escritorio, el botón «Usar mi ubicación» (decisión 8). Sin respuesta de ubicación no hay distancias.
  - Aceptación:
    - SC1: con Bus, el mapa recibe un punto de parada por cada parada cercana del fixture.
    - Tocar un icono o una fila escribe `?stop=<número>` y despliega el panel por debajo de `md`.
    - Sin permiso, la lista se calcula desde Sol, muestra las distancias y el aviso de BiciMAD con su texto (decisión 8).
    - Errores de la spec (5xx, sin red) muestran "No se pudieron cargar las paradas cercanas" + "Reintentar"; un `503` por cupo o un `429` con `Retry-After` muestran lo mismo sin «Reintentar» activo hasta ese tiempo.
  - Verificación: `pnpm --filter web test`; `pnpm --filter web depcruise`.
  - Archivos: `features/select-stop/*`, `widgets/bus-stops-map/*`, `widgets/bus-stop-list/*`, `pages/map/ui/MapPage.tsx`.
  - Dependencias: T2, T3.

- [ ] **T5: Detalle de la parada** (M, ~1 h 30 min)
  - Descripción: `widgets/bus-stop-detail`: número, nombre, dirección y distancia (de la lista de cercanas; sin distancia fuera de los 500 m). Líneas: tabla con cabeceras «Línea», «Hacia», «Horario», «Cada» en escritorio y lista de una fila por línea en móvil (decisión 9), con `Tag` para la línea y la etiqueta "Nocturno" en texto en las `N…`. `404` → "Parada no encontrada" + "Volver a la lista", sin reintento. `StaleNotice` con `stale`. El botón atrás cierra el detalle. Título del panel "Paradas" con Bus elegido.
  - Aceptación:
    - SC4: `/?service=bus&stop=72` abre el detalle; atrás vuelve a la lista; `?stop=99999999` muestra "Parada no encontrada".
    - `N1` muestra "23:30–05:30" y "Nocturno" en texto.
    - Escritorio muestra la tabla; móvil, la lista; los datos son los mismos.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/bus-stop-detail`.
  - Archivos: `widgets/bus-stop-detail/*`, `pages/map/ui/MapPanel.tsx`.
  - Dependencias: T4.

- [ ] **T6: Llegadas en el detalle** (M, ~1 h 30 min)
  - Descripción: lista de llegadas con `ArrivalRow` (línea, destino, `formatArrival`), sondeo cada 30 s. Estados de la tabla de errores de la spec: `stale` con «Actualizado hace X»; `[]` → "No hay autobuses previstos"; `404` no pide llegadas; `502`, `503`, `504`, `400`, `500` o sin red → "Llegadas no disponibles" + "Reintentar"; un fallo de sondeo mantiene las llegadas como mucho 2 min desde su `updatedAt` (`useNow`), luego "Llegadas no disponibles" y el autobús desaparece del mapa; `503` con `Retry-After` (cupo EMT) → texto de decisión 10 de la spec, sin botón; `429` con `Retry-After` → como un 5xx, con «Reintentar» tras el `Retry-After`. Un error en las llegadas no oculta el resto del detalle.
  - Aceptación:
    - SC3: con temporizadores falsos, una segunda petición a los 30 s; ninguna sin parada abierta; no hay polling con la pestaña oculta.
    - Con el sondeo fallando, las llegadas siguen 2 min y después aparece "Llegadas no disponibles" + "Reintentar".
    - `503` con `Retry-After` muestra el copy del cupo y ningún botón; vuelve solo tras `Retry-After`. `503` sin `Retry-After` se trata como 5xx.
  - Verificación: `pnpm --filter web exec vitest run src/widgets/bus-stop-detail src/entities/bus-stop`.
  - Archivos: `widgets/bus-stop-detail/ui/Arrivals.tsx`, `widgets/bus-stop-detail/model/useFreshArrivals.ts`, `entities/bus-stop/ui/ArrivalRow.tsx` (+ tests).
  - Dependencias: T5.

### Checkpoint: Fase 2

- [ ] `pnpm check:task` en verde.
- [ ] `dev:mock`: Bus → iconos → tocar uno → detalle con líneas y llegadas que se renuevan; sin ubicación, Sol con distancias. Revisión humana antes de la fase 3.

### Fase 3: Mapa enriquecido, buscador y cierre

- [ ] **T7: Popup en el mapa** (M, ~1 h 30 min)
  - Descripción: `base-map` añade `popup?: { at, content, onClose }` (`maplibregl.Popup` + portal de React). `bus-stops-map` muestra en el popup de la parada seleccionada su número y nombre, las líneas y las 3 primeras llegadas ("3 → San Amaro · 2 min"), con la misma query que el detalle. Se cierra con su botón, con `Escape`, al tocar otro punto y al cerrar el detalle. No es accesible por teclado desde el mapa (igual que los puntos; el camino accesible es la lista y el buscador). Por debajo de `md`, `focusPadding` deja el icono y el popup encima del bottom sheet.
  - Aceptación:
    - SC2: tocar un icono abre el popup y el detalle; el popup muestra 3 llegadas como mucho.
    - Abrir el popup no añade peticiones (MSW cuenta una sola petición de llegadas).
    - `Escape` y el botón de cerrar quitan `?stop`.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map src/widgets/bus-stops-map`.
  - Archivos: `shared/ui/base-map/{BaseMap.tsx,useMapPopup.ts}`, `widgets/bus-stops-map/ui/{BusStopsMap.tsx,StopPopup.tsx}` (+ tests).
  - Dependencias: T6.

- [ ] **T8: "Ver en el mapa" (posición del autobús)** (M, ~1 h 30 min)
  - Descripción: `base-map` añade `fitPoints`. Botón "Ver en el mapa el autobús de la línea X" en cada llegada con posición (`busLat` no nulo). El autobús se pinta como círculo con icono `bus` y la línea como texto, junto a la parada. Se mueve con cada sondeo y se quita al cerrar el detalle, al elegir otra llegada o al caducar las llegadas.
  - Antes de empezar: decidir cómo pintar icono y línea a la vez, porque `MapPointParams` admite uno u otro (pregunta abierta 1 de la spec). Opciones: (a) etiqueta HTML en el portal de `base-map`; (b) imagen propia dibujada en canvas. Se pregunta al usuario antes de codificar.
  - Aceptación:
    - SC5: pulsar el botón muestra el autobús y encuadra la parada y el autobús juntos (`fitPoints`).
    - Sin `busLat` no hay botón; con las llegadas caducadas, el autobús desaparece.
    - Con `prefers-reduced-motion`, `fitBounds` sin animación.
  - Verificación: `pnpm --filter web exec vitest run src/shared/ui/base-map src/widgets/bus-stops-map src/widgets/bus-stop-detail`.
  - Archivos: `shared/ui/base-map/{BaseMap.tsx,useMapLibre.ts}`, `widgets/bus-stops-map/ui/BusStopsMap.tsx`, `widgets/bus-stop-detail/ui/Arrivals.tsx`, `pages/map/ui/MapPage.tsx` (estado del autobús elegido).
  - Dependencias: T6, T7.

- [ ] **T9: Buscar paradas por número** (S, ~45 min)
  - Descripción: `widgets/transit-search/model/useBusSource.ts`: `useAllStops` (solo con Bus elegido) → `SearchSource`. Elegir un resultado escribe `?stop`.
  - Aceptación:
    - SC6: con Bus, escribir `276` lista la 2768 y `Enter` con `2768` abre su detalle.
    - Con BiciMAD no se pide `/v1/bus/stops` (MSW sin peticiones).
  - Verificación: `pnpm --filter web exec vitest run src/widgets/transit-search`.
  - Archivos: `widgets/transit-search/model/useBusSource.ts`, `widgets/transit-search/ui/TransitSearch.tsx` (+ test).
  - Dependencias: T2, T4.

- [ ] **T10: Cierre** (S, ~45 min)
  - Descripción: spec y capability map a **implemented**, changelog del plan y `web/AGENTS.md` si cambia la lista de search params (`?service`, `?stop`). Después del merge y del despliegue, probar en el móvil contra Render (la geolocalización necesita HTTPS).
  - Aceptación:
    - SC7: BiciMAD igual que antes en Render.
    - SC8: `pnpm check:task` en verde.
  - Verificación: `pnpm check:task`; manual en https://mad-transit-web.onrender.com con Bus y BiciMAD.
  - Archivos: `docs/specs/SPEC-web-bus.md`, `docs/specs/CAPABILITY-MAP.md`, `web/AGENTS.md`, este plan.
  - Dependencias: T1-T9.

### Checkpoint final

- [ ] SC1-SC8 comprobados; CI en verde.
- [ ] Pedir permiso antes de push, abrir el PR y hacer merge.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| El mock de MapLibre no tiene `Popup` ni `fitBounds` | Medio | Ampliar el mock en T7 y T8, en la misma tarea que lo necesita |
| El vehículo necesita icono y línea a la vez, y `MapPointParams` no lo admite | Medio | Decidir antes de T8 (pregunta abierta 1 de la spec) |
| El popup tapa el icono o queda debajo del bottom sheet en el móvil | Medio | `focusPadding` como con `?station`; comprobarlo en el checkpoint de la fase 2 y en Render |
| Los cambios de `MapPage` rompen BiciMAD | Alto | BiciMAD es el servicio por defecto y sus tests no se tocan (T2); SC7 |
| La lista de 4.900 paradas para el buscador tarda en el móvil | Bajo | Solo se pide con Bus en el buscador; gzip y ETag del API; `staleTime` de 24 h |
| El cupo diario de la EMT se agota y las llegadas dejan de cargar | Medio | Copy de decisión 10 y respeto de `Retry-After`; el resto de la app sigue |

## Paralelización

T3 puede hacerse en paralelo con T1 y T2. T9 solo necesita T2 y T4. El resto es secuencial porque comparte `MapPage` y `bus-stops-map`.

## Estimación

Unas 14 h en total. Fase 1 ~4 h 30 min, fase 2 ~5 h y fase 3 ~4 h 30 min. T8 puede alargarse si la opción del vehículo requiere dibujo propio.

## Changelog

- 2026-10-30: borrador a partir de la spec aprobada.
- 2026-10-30: se quita `inService`; un `502` de las llegadas se trata como el resto de errores.
- 2026-11-12: un PR por fase (cuatro PRs pequeños) en vez de uno solo, con un commit por tarea.
- 2026-11-12: fase 0 añadida (T0a y T0b, refactor previo a bus), tras la revisión de huecos entre plan y código.
- 2026-11-12: plan actualizado con la spec revisada (decisiones 8 a 10, supuestos renumerados). Cambios: cliente 0.9.0 (api-bus ya implementado); reutilización de `shared/ui/icons`, `map-point`, `ListItem`, `Tag`, `StatusText`, `EmptyState`, `Banner`, `ApproximateLocationNotice` y la pauta de reintentos de BiciMAD; T3 sin SVG a mano; T4 sin ubicación desde Sol; T5 tabla en escritorio y lista en móvil; T6 con el estado de cupo (`429`); T8 con la pregunta abierta del vehículo. Aprobado por el usuario el mismo día.
- 2026-11-12: corrección de códigos verificada en el API: cupo EMT agotado = `503` con `Retry-After`; `429` con `Retry-After` = límite por IP del API. Tareas T1 y T6 actualizadas.
- 2026-11-12: T1 hecha (commit `ca1ff0f`). Cliente 0.9.0 instalado. Decisiones no previstas: `useRestartingRefetch` y `withTimeout` movidos a `shared` en vez de duplicarlos (toca imports de BiciMAD, sin cambio de comportamiento; se documenta en el PR de la fase 1); `toNearParam` duplicado en `entities/bus-stop`, porque las entidades no se importan entre sí; `Retry-After` solo se parsea en segundos; fixture de la API con una sola parada (72), el resto da 404. Tests: 189 OK, typecheck y depcruise OK.
