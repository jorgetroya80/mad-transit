# Spec: web-ui-migration

- Created: 2026-11-11
- Status: **implemented** (2026-11-12)
- Plan: [PLAN-web-ui-migration.md](../plans/PLAN-web-ui-migration.md)

Módulo `web-ui-migration` del [Capability Map](CAPABILITY-MAP.md). Las pantallas de BiciMAD (escritorio y móvil) pasan a montarse con la librería genérica de [web-ui-library](SPEC-web-ui-library.md), y se retira todo lo que esa librería sustituye: piezas, tokens, iconos y la página temporal `/dev/components`. El contrato de cada pieza sigue siendo la sección «Librería de componentes» del documento «Mad Transit — Especificación de UI» (rev 54), y el de cada pantalla, sus secciones de escritorio y móvil, que son privadas. Cada «Sustituye a …» del documento dice qué pieza vieja reemplaza cada pieza nueva.

## Objective

- Una sola forma de pintar cada cosa: al acabar, cada pantalla usa las piezas de `shared/ui` y no queda una pieza vieja que haga lo mismo.
- Los textos y el conocimiento del dominio se quedan fuera de `shared/ui`: en `entities/station` (qué tono tiene cada nivel de disponibilidad) y en los `features`, `widgets` y `pages` que montan las pantallas.
- El usuario ve las pantallas de hoy, con los cambios de aspecto que el documento pide a propósito (supuesto 3). No se pierde ni cambia ninguna función, texto ni comportamiento de teclado o lector de pantalla, salvo lo que se dice abajo.
- `web-bus` monta sus pantallas sobre la librería sin heredar piezas viejas.

## Assumptions

Supuestos donde el documento no basta o no encaja con el código. Corrígelos ahora o sigo con ellos.

1. **Qué sustituye a qué** (del documento, comprobado en el código y en el lienzo; revisado con el usuario, 2026-11-11). Dos listas: lo que se borra y lo que se queda pero se rehace por dentro.

   **Se borra** (piezas de `shared/ui` y `entities`), sustituida por la pieza nueva:

   | Pieza nueva | Sustituye a (hoy) |
   | --- | --- |
   | `Banner` | `StatusBanner` |
   | `EmptyState` | `ErrorState`, `StateMessage` |
   | `CountBadge` | `AvailabilityBadge` (`entities/station`) |
   | `ListItem` | `StationRow` (`entities/station`) |
   | `Disclosure` | `CollapsibleSection` (hoy solo la usan las favoritas) |
   | `ControlGroup` + `IconButton` | `MapControls` (`base-map`) |
   | `drawMapPoint` | `pointImage.ts` |
   | `Icon` | los 14 iconos de `icons.tsx` e `IconFrame` |

   **Se queda y monta la pieza nueva** con sus textos (`features`, `widgets`, `pages` y los avisos de `data-freshness`):

   | Hoy | Monta |
   | --- | --- |
   | `NeedToggle` | `SegmentedControl` (`cards` en escritorio, `pill` en móvil) |
   | `SearchInput` | `SearchField` |
   | `NoResults` | `EmptyState` |
   | `StaleNotice`, `ApproximateLocationNotice`, `LocatingNotice`, `OfflineBar`, `OfflineBanner` | `Banner` |
   | `UpdatedIndicator` | `StatusText` y `Button` `sm` |
   | `CardAvailability` | `StatTile` |
   | `AvailabilityLegend` y la leyenda de «sin confirmar» de `MapNotice` | `Legend` |
   | `StationCard`, `SelectedStationCard`, `StationSheet`, `CardHeader`, `SheetCardHeader`, `CardBody` | `Card` (con `Card.Header` y `Card.Body`) |
   | `FavoriteButton` | `IconButton` (`pressed`, `tooltip`) |
   | `RecenterButton` | `IconButton` `floating` `lg`, `iconTone="primary"`, `iconSize={22}` (el lienzo lo pinta azul a 22 px) |

   **Se quedan como están**, solo con los tokens y la escala `text-*` nuevos, porque ni el documento ni el lienzo los hacen pieza de la librería:
   - `StationSection`: «Cerca de ti» es un encabezado con su leyenda, no se pliega.
   - `ResultList`: cada fila lleva sus flechas de teclado (`onKeyDown`) y `data-number`, que `ListItem` no admite.
   - `SourcePicker` (decisión del usuario, 2026-11-11): hoy nunca se ve, porque solo hay una fuente, y la spec de `web-bus` lo deja oculto (decisiones 5 y 7). Se decide y se retira en `web-bus`. No usa ningún token ni icono de los que se retiran.
   - `MapNotice`: «Las estaciones aparecerán aquí…» es una píldora blanca (ningún tono de `Banner`) y la capa «sin conexión» es un icono suelto con texto, sin círculo ni encabezado (no es `EmptyState`).
   - `BottomSheet`, `SidePanel`, `BaseMap` (sin `pointImage.ts`), `DataAttribution`, `RelativeTime` y `AppHeader`.

2. **El dominio, fuera de la librería** (revisado con el usuario, 2026-11-11).
   - **Una sola traducción de nivel a tono:** `availabilityTone(level)` en `entities/station/model/availability.ts`, junto a `availabilityFor` y `availabilityLabel`. Traduce `good`, `low`, `empty`, `off` y `unconfirmed` a `success`, `warning`, `danger`, `neutral` y `muted`, y devuelve los 6 tonos sin `inverse`. La usan `CountBadge`, `StatTile`, la etiqueta de estado de `ListItem` (`trailingCaption`), `Legend` y `MapPoint`. `TONE_BY_LEVEL` de `toMapPoints` desaparece; la tabla, con `satisfies Record<AvailabilityLevel, …>`, sigue fallando al compilar con un nivel nuevo.
   - **Los textos no se mueven:** `availabilityStatusText`, `availabilityCountText` y `availabilityLabel` siguen en `entities/station` y pasan a ser los textos que reciben las piezas (`statusLabel`, `srText`, `accessibleLabel`, `value`). Coinciden con el lienzo («Disponible», «Pocas»/«Pocos», «Sin bicis»/«Sin hueco»). Los demás textos («Cerrar la ficha de la estación», «Favorita»…) se quedan donde están o suben a quien monta la pieza.
   - **Ningún texto visible ni nombre accesible cambia.** Si el plan encuentra uno que no coincide con el documento, se pregunta antes.
   - **El indicador de actualización tiene su propia tabla** en `data-freshness`, porque traduce el estado de los datos y no un nivel: `ok` → `success`, `stale` → `warning`, `error` → `danger`, `offline` → `neutral`, los tonos de `StatusText`.

3. **Cambios de aspecto buscados**, todos del documento (rev 54) y ya decididos en `web-ui-library`:
   - **Puntos del mapa:** halo de 2 px (hoy 1,5), anillo de seleccionado de 4 px (hoy 3), cifra de 15 px (hoy 14) y `muted` sin halo. `danger` sigue continuo (supuesto 6 de la librería).
   - **Posición del usuario:** hoy es un relleno de 16 px con borde blanco de 3 px por fuera (22 px en total) y sin halo. Pasa a relleno de 12 px, borde de 2 px (16 en total) y halo de 22 px al 18 %, como pide el documento: se ve más pequeño a propósito. El halo es una segunda capa `circle` debajo; las dos siguen en `base-map`, fuera de la librería.
   - **Iconos:** los dibujos del lienzo; cambian a la vista `dock`, `refresh`, `bike` y algunos más.
   - **«Fuera de servicio»:** su texto pasa de `availability-off-label` (`#4b5563`) a `tone-neutral-label` (`#4a5462`); no se nota y el contraste sigue por encima de 7:1. Era el único token viejo que no era alias.
   - **Volver:** de flecha a `chevron-left`, y de 24 a 22 px (supuesto 5).
   - **Favoritas:** la estrella del encabezado pasa a rellena y de 20 a 18 px (supuesto 6).
   - **Ficha:** las dos cajas de disponibilidad pasan a `StatTile`: la caja entera toma el tono (fondo suave y borde del tono; vacía en blanco con borde rojo discontinuo), donde hoy es gris con el número de color.
   - **Textos:** la cabecera del panel móvil ya mide lo del lienzo (17 px en negrita y 13 px); solo gana el interlineado y baja unos 5 px (decisión aplazada en T1 de la librería). `text-sheet-title` se queda con interlineado; `text-sheet-subtitle` pasa a `text-meta` (mismo tamaño, 18 px de línea) y se retira. Las piezas usan la escala `text-*`.
   - **La referencia es el lienzo, no la pantalla de hoy.** Las piezas salen del lienzo y las pantallas de hoy de una versión anterior, así que habrá diferencias pequeñas (radios, rellenos, el dibujo de la bandeja). Cada tarea compara su zona antes y después a 1440 y 390 px: lo que coincide con el lienzo se acepta y se apunta en el plan; lo que no, es un error y se arregla; si arreglarlo exige tocar una pieza de la librería, se pregunta antes.

4. **Ningún cambio de teclado** (revisado con el usuario, 2026-11-11). `NeedToggle` ya usa botones con `aria-pressed` y pasa a `SegmentedControl` con la misma etiqueta oculta («¿Qué quieres hacer?», `labelVisible={false}`). `SourcePicker`, el único grupo de radios, se queda como está hasta `web-bus` (supuesto 1).

5. **El botón de volver** (revisado con el usuario, 2026-11-11), como lo dibuja el lienzo en las tres pantallas móviles: `IconButton` `ghost` `md` (44 px) con `icon="chevron-left"`, `iconSize={22}` e `iconTone="primary"`, y el nombre de hoy, «Volver a la lista». Hoy es `ArrowLeftIcon` a 24 px, que se borra con `icons.tsx` (supuesto 7). El `Icon` de la librería pierde también el nombre `arrow-left`, que ya nadie usa (decisión del usuario): pasa a 20 nombres, con su dibujo, su test y su ejemplo fuera.

6. **Favoritas con `Disclosure`, como hoy** (revisado con el usuario, 2026-11-11):
   - **Mismo nombre accesible:** el botón y la región se leen «Favoritas · 2»; `Disclosure` recibe `count={String(stations.length)}`. El test de `StationList` que lo comprueba no cambia.
   - **El estado lo guarda `FavoriteStations`:** `useLocalStorage` con la misma clave (`FAVORITES_OPEN_STORAGE_KEY`, `bicimad-now:favorites-open`), el mismo `parseOpen` y abierta por defecto; pasa `open`, `onOpenChange` y `headingLevel={level}`. El usuario no pierde lo que tenía guardado.
   - **Estrella rellena:** `icon="star-filled"` a 18 px, como el lienzo (hoy `StarIcon` de contorno a 20 px).
   - **Se queda igual:** el `div` con `data-station-list="favorites"` que usa la página para devolver el foco, la versión sin plegar (`isCollapsible` falso, con `StationSection`) y el encabezado enfocable por código.

7. **Se retira cuando ya nadie lo use**, en el PR que lo deja sin uso (supuesto 10; revisado con el usuario, 2026-11-11):
   - Las piezas viejas de la primera lista del supuesto 1, con sus tests y sus carpetas.
   - Los tokens `availability-*` y `notice-*` (alias desde `web-ui-library`) y `text-sheet-subtitle` (supuesto 3). Las piezas que se quedan también los dejan: `MobileSheetHeader` y `MapNotice` pasan a sus `tone-*` (por ejemplo, `notice-stale-foreground` → `tone-warning-soft-foreground`), y `MapNotice` cambia `OfflineIcon` por `Icon name="wifi-off"`.
   - **Los anillos de foco escritos a mano:** desaparecen con las piezas que se migran, y los que se quedan (`ResultList`, `BottomSheet`, `StationSection`) pasan a la utilidad `focus-ring`. `SourcePicker` sigue igual hasta `web-bus`.
   - **`mapColors.ts` se queda, más pequeño:** solo lee los colores de la posición del usuario (`map-user-location`, el borde blanco y el halo), que `readMapPointStyle()` no lleva porque la posición está fuera de la librería. Se van los tonos, `emptyStroke` y `readMapFontFamily`. `points.ts` se queda, y su tipo `MapPoint` pasa a llevar los parámetros de `drawMapPoint`; el `MapPointTone` viejo (`good`, `low`…) desaparece y `shared/ui/index.ts` ya puede exportar el de la librería.
   - El nombre `arrow-left` del `Icon` de la librería (supuesto 5).
   - La página `/dev/components`, su ruta solo de desarrollo en `app/router.tsx` y sus tests.
   - **Se quedan:** los alias `primary-*` (la librería misma los usa, como `bg-primary` en `Button`, y es el color de marca), `text-sheet-title`, y en `data-freshness` `StaleNotice` y `UpdatedIndicator`, que montan las piezas nuevas.
   - **Un test de retirada solo para tokens:** busca en `web/src` las clases y variables `availability-*`, `notice-*` y `text-sheet-subtitle` y falla si queda alguna. Las piezas borradas no necesitan test: si alguien las importa, no compila.

8. **Los tests de pantalla se adaptan, sin bajar el listón** (revisado con el usuario, 2026-11-11):
   - **Comportamiento intacto:** las aserciones de rol, nombre accesible, `aria-*`, foco, teclado, textos, regiones vivas y lo que se pide a la API no cambian. Si el floor guard avisa de una, es un error del cambio, no del test.
   - **Aspecto, test primero:** en cada zona, la aserción de clase pasa primero a la clase nueva (por ejemplo, `bg-chip` → `bg-tone-success-soft` en la ficha) y falla; después se migra la zona y pasa.
   - **Antes de borrar un test viejo**, el plan apunta dónde queda probado lo que comprobaba (en la librería, en `entities/station` o en el test de la pantalla), y lo que no esté en ningún sitio se añade antes. Ejemplo: los textos de lector de `AvailabilityBadge` («3 bicis disponibles») no están en `CountBadge`, que no sabe de bicis.
   - **El floor guard avisará** de cada test borrado (`test-deleted`, unos 15) y de cada `expect` cambiado (`assertion-removed`; 21 tests de pantalla miran clases). En CI solo avisa; en local corta `pnpm check:task`, porque va en `check:fast` antes que los tests. En esas tareas se corre el guard solo, para ver su lista, y después el resto de `check:task` por separado (tests de web con cobertura, tests de api, cobertura de líneas cambiadas y depcruise), y se informan los dos resultados reales.
   - **Cada aviso se explica en el commit**, como en `049feeb`, `4a20af7` y `d6da8c1` («The floor guard flags N …»): cuántos, de qué tipo y por qué cada uno refuerza o mueve el test, no lo afloja.
   - Ningún test se salta ni se debilita para que pase.

9. **Seis PRs y una sola release** (decisiones del usuario, 2026-11-11):
   - **Excepción a «un PR por módulo»** (AGENTS.md): una spec y un plan, con el trabajo en seis fases; cada fase es un PR desde `main` que se mergea antes de empezar el siguiente (supuesto 10). Los PRs son más pequeños, se revisan en el navegador uno a uno y un fallo en una zona no bloquea las demás.
   - **Tipos:** los PRs 2 a 5 son `feat(web)`, porque cambian lo que ve el usuario (supuesto 3); el 1 (base, nada cambia a la vista) y el 6 (retirada) son `refactor(web)` (decisión del usuario, 2026-11-11). Dentro de cada PR, un commit por tarea con el tipo que le toque. Cada PR solo toca `web/` y `docs/`, como el #112, que pasó el `release-scope`.
   - **Una sola release:** release-please junta los `feat` en un único PR de release (`separate-pull-requests: false`, `bump-minor-pre-major: true`), y ese PR se mergea solo al terminar el PR 6, con permiso del usuario: sale web 0.10.0 → 0.11.0, con un solo despliegue en Render y una línea de changelog por zona. Hasta entonces `main` mezcla piezas viejas y nuevas, pero nada llega al usuario. Cualquier otro cambio de web que se mergee mientras tanto entra en esa misma release.
   - La subida del cliente de la API de 0.8.0 a 0.9.0 no es parte de este módulo: solo trae los endpoints del bus y va antes de `web-bus`, como dice el capability map.

10. **Orden y reparto en PRs** (revisado con el usuario, 2026-11-11). Cada PR migra una zona entera, cambia sus iconos viejos por `Icon` y borra lo viejo que deja sin uso:

    | PR | Zona | Monta | Borra |
    | --- | --- | --- | --- |
    | 1 | Base | `availabilityTone()`; `focus-ring` en `ResultList`, `BottomSheet` y `StationSection`; sin `arrow-left` | — |
    | 2 | Lista | filas con `ListItem` y `CountBadge`, `Legend`, favoritas con `Disclosure`, avisos de ubicación con `Banner`, errores y lista vacía con `EmptyState` | `StationRow`, `CollapsibleSection` |
    | 3 | Ficha | `Card`, `StatTile`, estrella y volver con `IconButton`, sus errores con `EmptyState` | `AvailabilityBadge`, `ErrorState`, `StateMessage` |
    | 4 | Buscador y panel | `SearchField`, `NeedToggle`, `NoResults`, `StaleNotice`, avisos sin conexión, `UpdatedIndicator`, cabecera móvil | `StatusBanner` |
    | 5 | Mapa | `drawMapPoint`, posición del usuario, zoom con `ControlGroup`, centrar, `MapNotice` con tokens nuevos y `Legend` | `pointImage.ts`, `MapControls`, el `MapPointTone` viejo |
    | 6 | Retirada | test de retirada de tokens | `icons.tsx`, `IconFrame`, tokens viejos, `text-sheet-subtitle`, `/dev/components` |

    - **Rama por PR desde `main`:** `feat/web-ui-migration-<n>-<zona>` (por ejemplo, `feat/web-ui-migration-2-list`), abierta después de mergear el anterior.
    - **Revisión visual antes de cada merge:** el usuario mira la zona con `pnpm --filter web dev` a 1440 y 390 px contra el lienzo.
    - **`/dev/components` se queda hasta el PR 6**, para comparar mientras dura la migración.
    - **Documentos:** la spec, el plan y el capability map entran en el PR 1; cada PR apunta sus decisiones en el changelog del plan; después de la release, un PR `docs` los pasa a implemented.
    - Cada tarea deja la app funcionando, con la pieza vieja todavía en el código si otra zona la usa.

## Tech Stack

El de [web-ui-library](SPEC-web-ui-library.md#tech-stack): React 19.3, Tailwind 4.3 (`@theme static`), Vitest 5, Testing Library, axe-core y MapLibre GL. Sin dependencias nuevas.

## Commands

```bash
pnpm --filter web dev
pnpm --filter web test
pnpm --filter web test:coverage
pnpm --filter web depcruise
pnpm --filter web lint
pnpm --filter web build
pnpm check:task
```

## Project Structure

```
web/src/entities/station/            + availabilityTone(); - AvailabilityBadge, StationRow
web/src/features/filter-by-need/     NeedToggle monta SegmentedControl
web/src/features/search-by-number/   SearchInput → SearchField; NoResults → EmptyState; SourcePicker igual (web-bus)
web/src/features/toggle-favorite/    FavoriteButton monta IconButton (pressed, tooltip)
web/src/widgets/station-card/        las fichas montan Card, StatTile y Banner
web/src/widgets/station-list/        filas con ListItem + CountBadge; secciones con Disclosure; Legend
web/src/widgets/stations-map/        puntos con drawMapPoint; MapNotice → Banner
web/src/pages/map/                   OfflineNotice → Banner; RecenterButton y zoom con ControlGroup
web/src/shared/ui/                   - status-banner, error-state, state-message, collapsible-section,
                                       data-freshness (UpdatedIndicator, StaleNotice), icons.tsx, IconFrame,
                                       base-map/{pointImage,mapColors,MapControls}
web/src/pages/dev-components/        - entera, con su ruta en app/router.tsx
web/src/app/styles/index.css         - availability-*, notice-*, text-sheet-subtitle (supuesto 7)
```

Capas como hoy (depcruise): `shared` no importa de nadie de arriba; `availabilityTone()` vive en `entities`, no en `shared`.

## Code Style

El de [web-ui-library](SPEC-web-ui-library.md#code-style). Quien monta una pieza le pasa el tono y los textos; la traducción del dominio va en una función pequeña de `entities`:

```tsx
const AVAILABILITY_TONE = {
  good: 'success',
  low: 'warning',
  empty: 'danger',
  off: 'neutral',
  unconfirmed: 'muted',
} as const satisfies Record<AvailabilityLevel, Tone>;

export function availabilityTone(level: AvailabilityLevel): Tone {
  return AVAILABILITY_TONE[level];
}

<CountBadge value={String(count)} tone={availabilityTone(level)} />
```

## Testing Strategy

- **Test primero en cada zona:** antes de cambiar una zona, sus tests de comportamiento pasan contra lo viejo; después del cambio pasan igual (supuesto 8).
- **Por zona:** las pantallas de escritorio y móvil en cada estado de `web-error-states` (con datos, cargando, `error`, `stale`, `offline`, sin resultados), con axe en cada uno.
- **Teclado y foco:** se mantienen los tests de hoy (`useListFocusReturn`, Escape en la ficha, foco al título, orden de Tab), sin cambiar ninguno (supuesto 4).
- **Favoritas:** se abren y cierran como hoy y el estado sobrevive a recargar (misma clave de `localStorage`).
- **Mapa:** `toMapPoints` y las capas piden los ids de `mapPointImageId`; la imagen se registra en `styleimagemissing` con `drawMapPoint` sobre un pintor falso; la cifra espera a `mapPointValueFont(style)`.
- **Retirada:** un test busca en `web/src` los tokens retirados y falla si aparece alguno (supuesto 7). El build no contiene `/dev/components`.
- Cobertura ≥ 80 % por capa y ≥ 80 % de las líneas cambiadas (`changed-coverage`); depcruise sin violaciones; floor guard limpio o con cada aviso explicado en el commit, y el resto de `check:task` en verde (supuesto 8).

## Boundaries

- **Siempre:** los textos de hoy; las piezas de `shared/ui` tal como están; una zona por tarea con la app funcionando; comprobar a 1440 y 390 px contra el lienzo.
- **Preguntar antes:** cambiar una pieza de la librería (parámetro, color o medida) para que encaje en una pantalla; cambiar un texto, un nombre accesible o un comportamiento de teclado que no esté en los supuestos; cualquier dependencia; retirar algo que no esté en el supuesto 7.
- **Nunca:** palabras de dominio en `shared/ui`; dejar dos piezas que hagan lo mismo al terminar; saltar o debilitar un test; hex fuera de `index.css`.

## Success Criteria

1. SC1: ninguna pieza de la tabla del supuesto 1 sigue en el código, y cada pantalla de BiciMAD usa la pieza nueva que la sustituye.
2. SC2: los tokens `availability-*`, `notice-*` y `text-sheet-subtitle` están retirados (un test lo comprueba); `icons.tsx`, `IconFrame`, `pointImage.ts`, los anillos de foco escritos a mano (salvo `SourcePicker`) y `/dev/components` también, y el build no incluye la página; `mapColors.ts` solo lee los colores de la posición del usuario.
3. SC3: todos los textos visibles y nombres accesibles de hoy siguen igual, salvo los que pida el documento (lista en el plan); los tests de comportamiento pasan sin cambiar sus aserciones.
4. SC4: los cambios de aspecto son los del supuesto 3 o coinciden con el lienzo y están apuntados en el plan; no cambia ningún comportamiento de teclado (supuesto 4).
5. SC5: en cada PR, el resto de `check:task` en verde (tests, cobertura, depcruise, el test de palabras de dominio de `shared/ui`), el floor guard limpio o con cada aviso explicado en el commit (supuesto 8), y CI en verde.
6. SC6: revisión visual del usuario de las dos pantallas en cada estado, a 1440 y a 390 px, contra el lienzo; y comprobación en Render después del despliegue de la única release (web 0.11.0).

## Open Questions

Ninguna. Las dos de la primera versión las decidió el usuario (2026-11-11): release `feat(web)` (supuesto 9) y selector de servicio con botones; al revisar el supuesto 4 se vio que ese selector nunca se ve, y se queda para `web-bus`.

## Changelog

- 2026-11-11: borrador a partir del capability map, de los «Sustituye a …» del documento (rev 54) y del inventario del código tras `web-ui-library`. Pasa a in review.
- 2026-11-11: preguntas abiertas resueltas por el usuario: `feat(web)` con release (web 0.11.0) y selector de servicio con botones, como pide el documento.
- 2026-11-11: supuesto 1 revisado con el usuario contra el lienzo: dos listas (se borra / se rehace por dentro); `StationSection`, `ResultList` y `MapNotice` se quedan; `RecenterButton` con icono `primary` de 22 px. Supuesto 3 gana el cambio de `StatTile` en la ficha.
- 2026-11-11: supuesto 2 revisado con el usuario: `availabilityTone()` única (sustituye a `TONE_BY_LEVEL`), los textos se quedan en `entities` y ninguno cambia, tabla propia para `UpdatedIndicator`. Supuesto 3 gana el gris de «Fuera de servicio».
- 2026-11-11: supuesto 3 revisado con el usuario: medidas exactas de la posición del usuario (con capa de halo), `text-sheet-subtitle` pasa a `text-meta`, y la referencia es el lienzo con comparación antes y después por tarea.
- 2026-11-11: supuesto 4 revisado con el usuario: `SourcePicker` nunca se ve (una sola fuente) y se queda para `web-bus`; el módulo no cambia ningún comportamiento de teclado.
- 2026-11-11: supuesto 5 revisado con el usuario: volver con `IconButton` `ghost` y `chevron-left` de 22 px, como el lienzo; `ArrowLeftIcon` se borra.
- 2026-11-11: decisión del usuario: `arrow-left` sale también del `Icon` de la librería (20 nombres). Es el único cambio de `shared/ui` que pide este módulo; la spec de `web-ui-library` hablaba de 21.
- 2026-11-11: supuesto 6 revisado con el usuario: mismo nombre accesible, estado en `FavoriteStations`, estrella rellena de 18 px y lo que se queda igual.
- 2026-11-11: supuesto 7 revisado con el usuario: `mapColors.ts` se queda para la posición del usuario, los que se quedan dejan los tokens viejos y los anillos a mano, y el test de retirada solo busca tokens.
- 2026-11-11: supuesto 8 revisado con el usuario: test primero en los cambios de aspecto, dónde queda probado cada test que se borra, y cómo se corre `check:task` cuando el floor guard avisa.
- 2026-11-11: supuesto 9 revisado con el usuario: seis PRs (`feat(web)` del 1 al 5 y `refactor(web)` el 6) y una sola release 0.11.0, con el PR de release mergeado al final; la subida del cliente sale del módulo. SC5 se ajusta al floor guard.
- 2026-11-11: supuesto 10 revisado con el usuario: seis PRs por zona (base, lista, ficha, buscador y panel, mapa, retirada), cada uno borra lo que deja sin uso, con revisión visual antes de cada merge.
- 2026-11-11: aprobada por el usuario.
- 2026-11-11: el PR 1 pasa a `refactor(web)`, porque no cambia nada a la vista (decisión del usuario al aprobar el plan).
- 2026-11-12: T8 necesita ampliar la librería (decisión del usuario). `SearchField` gana `ref`, `onKeyDown`, un `aria-describedby` extra, `inputMode="text"` y una pista que se oculta solo a la vista. El `status` de `EmptyState` envuelve el título y el mensaje, y su texto lleva un `id`. Va como commit previo en el PR 4. «Prueba con» pasa de h2 a h3, como en el diseño. El icono sigue siendo `search` y los textos no cambian.
- 2026-11-12: SC1 a SC5 comprobados al cerrar T15 (detalle en el changelog del plan). Quedan SC6, con la revisión visual del PR 6 y Render tras la release 0.11.0, y el paso a **implemented**.
- 2026-11-12: SC6 comprobado en Render tras la release web 0.11.0 (#116), con los arreglos #122 y #123. Pasa a **implemented**.
