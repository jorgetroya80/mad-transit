# Spec: web-error-states

- Created: 2026-11-09
- Status: **approved** (2026-11-09)
- Plan: [PLAN-web-error-states.md](../plans/PLAN-web-error-states.md)

Módulo `web-error-states` del [Capability Map](CAPABILITY-MAP.md), el sexto del rediseño de la UI. Es la fase 6 («Estados de error») del documento «Mad Transit — Especificación de UI» (revisión 32), con su tabla «Estados de error», y los tableros «Error · …», «Escritorio · …», «Búsqueda sin resultados» y «Ficha de estación — 3 alternativas por estado» del lienzo «Mad Transit · rediseño», que son privados. Da a los estados de [web-data-state](SPEC-web-data-state.md) los textos y pantallas del diseño en las dos composiciones de [web-redesign-desktop](SPEC-web-redesign-desktop.md) y [web-redesign-mobile](SPEC-web-redesign-mobile.md).

## Objective

Que, cuando algo falla, el usuario sepa qué pasa, si es culpa suya o del servicio, qué puede seguir haciendo y cuándo se arregla solo.

- Como usuario, si el servicio no responde y no hay datos guardados, veo «No podemos cargar las estaciones», sé que no es mi conexión, puedo pulsar «Reintentar» y veo cuántos segundos faltan para el siguiente intento automático.
- Como usuario, si falla la actualización pero tengo datos, sigo viendo la lista y el mapa en gris con la hora del dato y un aviso con «Reintentar».
- Como usuario sin conexión, veo un aviso oscuro que me lo dice, la lista guardada con su hora y un mensaje sobre el mapa; al volver la conexión todo se recupera solo.
- Como usuario, si busco un número que no existe, el buscador me lo dice y me propone la estación más cercana o volver a las cercanas.
- Como usuario, el detalle de una estación fuera de servicio, sin confirmar o inexistente me dice qué significa y qué puedo hacer.
- Como usuario de lector de pantalla, cada aviso se anuncia una vez y la cuenta atrás no me interrumpe.

**Fuera de alcance:** los estados de Bus (llegadas no disponibles, cupo, sin autobuses), que llegan con `web-bus`; abrir la app sin conexión (`web-offline-shell`); el arrastre del panel (`web-sheet-drag`); la búsqueda por nombre, que no existe (la búsqueda es solo por número desde `web-redesign-components`); las alternativas B y C de la ficha de estación; el selector BiciMAD / Bus y el subtítulo «BiciMAD y autobuses EMT en tiempo real» de los tableros, que llegan con `web-bus`.

## Decisiones (2026-11-09, del usuario)

1. **Búsqueda sin resultados, textos adaptados a la búsqueda por número.** «No hay ninguna estación «999»» y «Revisa el número que aparece en la estación.». Sugerencias: la estación cercana más próxima y «Ver estaciones cercanas», que borra la búsqueda. Sin «Plaza Mayor» ni «prueba con el nombre de una calle o plaza».
2. **El mensaje sin resultados va en el desplegable** del buscador, donde hoy sale «Ninguna estación con el número…», igual en escritorio y móvil. La lista sigue debajo.
3. **Sin conexión, una capa opaca sobre el mapa**, que sigue montado debajo: al volver la conexión la capa desaparece sin recargar el mapa.
4. **Ficha de estación, alternativa A** (dos cifras con estado, la de hoy) del tablero «Ficha de estación — 3 alternativas por estado».
5. **Cuenta atrás real, sin `Retry-After`.** El pie dice la espera que de verdad toca (30, 60 o 120 s), no el «30 s» fijo del lienzo. La web no lee `Retry-After`: el API solo la manda con el cupo agotado (503 `quota-exhausted`) y con el límite por IP (429), y esos casos siguen el mismo calendario.

## Estados y pantallas

| Estado | Escritorio | Móvil |
| --- | --- | --- |
| `error` (servicio, sin datos) | Panel: `ErrorState` en lugar de favoritas y lista; buscador desactivado; mapa sin puntos con aviso flotante; indicador rojo «Sin datos del servicio» | `ErrorState` dentro del panel en `half`; mapa sin puntos con aviso flotante |
| `offline` sin datos | `ErrorState` con los textos de conexión, sin «Reintentar» (supuesto 4); buscador desactivado; capa sobre el mapa; indicador gris «Desconectado»; sin barra oscura | Igual, dentro del panel en `half`; sin aviso oscuro |
| `stale` | Indicador ámbar «Datos de hace N min» + «Reintentar» (ya existe); `StatusBanner` `stale` en el panel; lista y puntos `unconfirmed`; leyenda «Gris = dato sin confirmar» sobre el mapa | `StatusBanner` `stale` en el panel con «Reintentar»; subtítulo de la cabecera en ámbar con la hora; lista y puntos `unconfirmed` |
| `offline` con datos | Barra oscura a todo el ancho bajo la cabecera; indicador gris «Desconectado» (ya existe); capa sobre el mapa; lista «Últimos datos guardados» | Aviso oscuro arriba, bajo el modo; capa sobre el mapa; panel con «Últimos datos guardados» |
| Búsqueda sin resultados | En el desplegable del buscador (decisión 2) | Igual |

## Assumptions

1. **`ErrorState`** (`shared/ui/error-state/`, nuevo): bloque centrado con icono en círculo, `h2`, texto, botón primario «Reintentar» de 48 px y un pie. `role="alert"` en el contenedor del título y el texto; el pie con la cuenta atrás queda fuera de esa región y con `aria-live="off"`, para que el lector no lo repita cada segundo. «Reintentar» sigue la regla del documento: pide en el acto, reinicia la espera y lleva `aria-busy` mientras pide. Sustituye al `StateMessage` `error` de la lista cercana; `StateMessage` se queda con `empty`, `loading` y el `error` corto del detalle.
2. **Textos de `error`:** título «No podemos cargar las estaciones»; texto «El servicio de BiciMAD no está respondiendo. Suele ser temporal; no es un problema de tu conexión.»; pie «Volveremos a intentarlo solos en N s.». Mapa: «Las estaciones aparecerán aquí cuando se recupere el servicio».
3. **Cuenta atrás real** (decisión 5). `useDataStatus` añade `nextRetryAt`: la hora del último fallo (`errorUpdatedAt`) más la espera que toca (30, 60 o 120 s, la de `stationQueries`). El pie cuenta hacia atrás cada segundo; en 0 o con la petición en curso dice «Intentándolo de nuevo…». Con la pestaña oculta no hay reintentos (`web-data-state`), y el pie no cambia hasta volver.
4. **`offline` sin datos** (tableros «Escritorio · sin conexión, sin datos» y «Error · sin conexión, sin datos», 2026-11-09): `ErrorState` con icono de conexión en círculo gris (no rojo), título «Sin conexión a internet» y texto «Necesitas conexión para ver las estaciones la primera vez. Se cargarán solas al volver a conectarte.»; sin «Reintentar» ni cuenta atrás, porque la consulta se relanza sola al volver la conexión. El mapa lleva la capa opaca con solo «El mapa no se puede cargar sin conexión». No hay barra ni aviso oscuro: el bloque central, con `role="alert"`, es el único aviso.
5. **Buscador sin datos:** desactivado, con el placeholder «No disponible hasta recuperar los datos» con `error` y «Disponible al volver a conectarte» con `offline`, en lugar de la ayuda. Con `offline` y datos, placeholder «Busca entre las estaciones guardadas»; busca en la lista guardada, como hoy.
6. **`stale`:** el `StatusBanner` `stale` del panel pasa a «**No hemos podido actualizar.** Mostramos los datos de las 10:42; puede que ya no sean exactos.» en escritorio y «**Datos de hace 12 min.** No hemos podido actualizar; puede que ya no sean exactos.» en móvil, los dos con la acción «Reintentar». Sustituye al `StaleNotice` de hoy («Sin confirmar: datos de …»). Hora en formato 24 h local y antigüedad en minutos redondeados (documento, «Detalles»). Con datos de menos de un minuto (el API dijo `stale`), la hora sigue y la antigüedad dice «hace menos de 1 min».
7. **El aviso `stale` sale si cualquiera de las consultas está `stale`**, la de cercanas o la lista completa, y no solo la de cercanas como hoy (hallazgo opcional 1 de la revisión de `web-data-state`). Usa la hora más antigua de las dos.
8. **Subtítulo móvil en `stale`:** «Última actualización: 10:42 · hace 12 min», en el color de texto de `notice-stale`.
9. **Leyenda del mapa en escritorio con `stale` u `offline` con datos:** chip flotante abajo a la izquierda, «Gris = dato sin confirmar», con la muestra gris del punto, `aria-hidden` (la lista ya lo dice con texto). No tapa la atribución ni `MapControls`.
10. **`offline` con datos:** escritorio, barra oscura (`notice-offline`) a todo el ancho entre la cabecera y el contenido, `role="alert"`: «**Sin conexión a internet.** Mostramos los últimos datos guardados; se actualizará solo al volver a conectarte.». Móvil, el mismo `StatusBanner` `offline` arriba, bajo el modo, con «**Sin conexión a internet.** Se actualizará solo al volver a conectarte.». Sustituye al «Sin conexión» del panel.
11. **Lista guardada:** con `offline`, el encabezado de cercanas pasa a «Últimos datos guardados» con el pie «De las 10:42 · pueden no estar al día». En móvil, el `h2` de la cabecera del panel también; la franja de `hidden` dice «Mostrar lista · Últimos datos guardados».
12. **Capa del mapa** (decisión 3): con `offline` o `error` sin datos, un mensaje sobre el mapa. Con `offline` es una capa opaca (`surface-muted`) con icono, «El mapa no se puede cargar sin conexión» y, en escritorio, «Puedes seguir consultando la lista de la izquierda.» (en móvil, «… la lista de abajo.»). Con `error` es solo el aviso flotante arriba del mapa del supuesto 2, sin capa: el mapa base funciona. El contenedor sigue con `aria-label="Mapa de estaciones"`; la capa lleva `role="status"` sin repetir lo que ya dijo la barra.
13. **Búsqueda sin resultados** (decisiones 1 y 2): en el desplegable, bajo el buscador, un bloque `role="status"` con «No hay ninguna estación «999»», «Revisa el número que aparece en la estación.» y «Prueba con»: un botón por la estación cercana más próxima («33 · Puerta del Sol», la abre como un resultado) y «Ver estaciones cercanas» (borra la búsqueda y deja el foco en el buscador). Sin cercanas cargadas, solo el segundo. El input lleva `aria-describedby` al bloque. `SearchSource` gana una sugerencia opcional (`suggestion?: SearchItem`) que da `useBicimadSource`.
14. **Ficha de estación, alternativa A** (decisión 4), en la tarjeta de escritorio y en el detalle del panel móvil, con los textos de los estados del tablero «Móvil — estación elegida» (más reciente que «Ficha de estación», cuyo pie de fuera de servicio era «Estado según la EMT · hace 30 s»):
    - **Fuera de servicio:** un aviso `role="status"` «Fuera de servicio» con «No se pueden sacar ni dejar bicis.» en lugar de las dos insignias, y el pie «Actualizado hace 30 segundos», con el `UpdatedAt` de toda la app (el lienzo abrevia «30 s»; decisión del usuario, 2026-11-09). La tarjeta de escritorio, que no tenía pie, gana el mismo que el panel móvil.
    - **Sin confirmar:** las dos insignias en gris como hoy y el pie «Último dato: 10:42 · hace 12 min».
    - **No encontrada:** meta «Estación 999» y título «Estación no encontrada», sin estrella; cuerpo `role="alert"` «No hay ninguna estación de BiciMAD con el número 999. Puede que el enlace sea antiguo o que la estación se haya retirado.» y el botón «Volver a la lista» (cierra la tarjeta o vuelve a la lista del panel, como «Cerrar» y la flecha); sin pie.
    - **Error de carga** (sin datos del detalle): `role="alert"` «No se pudo cargar la estación» con «El servicio de BiciMAD no está respondiendo. Suele ser temporal.» y «Reintentar»; sin pie.
15. **Al volver a `ok`** los avisos desaparecen sin animación y el indicador vuelve a verde (documento, «Detalles»).

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

Manual en `dev:mock`, a 1440 px y a 390 px, con DevTools: bloquear la URL del API y recargar (`error`, cuenta atrás 30 → 60 → 120 s); bloquearla con datos (`stale`); «Offline» en Network con datos (`offline`); buscar «999»; abrir `?station=999` y una estación sin servicio. Los cinco checks de la fase 6 del documento, incluido que el lector anuncia cada aviso una vez (VoiceOver).

## Project Structure

```
web/src/
  shared/ui/error-state/                 ErrorState: icono, título, texto, Reintentar, pie con cuenta atrás
  shared/ui/status-banner/               textos con negrita inicial; variante de ancho completo para la barra offline
  shared/ui/data-freshness/              StaleNotice con los textos de escritorio y móvil; formato HH:MM
  entities/station/model/useDataStatus   + nextRetryAt
  entities/station/api/stationQueries    expone la espera que toca tras un fallo
  features/search-by-number/             bloque sin resultados, sugerencias, buscador desactivado
  widgets/transit-search/model/          sugerencia (cercana más próxima) y estado de la fuente
  widgets/station-list/ui/               ErrorState, «Últimos datos guardados», aviso stale de las dos consultas
  widgets/station-card/ui/               fuera de servicio, no encontrada, pies de la alternativa A
  widgets/stations-map/ui/               aviso flotante de error, capa offline, leyenda gris
  pages/map/ui/                          barra offline de escritorio, aviso offline móvil, subtítulo y franja
```

## Code Style

El de [web-redesign-components](SPEC-web-redesign-components.md#code-style): cada pieza nueva con su test de `expectNoAxeViolations`, clases enteras en mapas con `satisfies`, textos en español. Los textos de cada estado viven en un mapa por estado, no en ramas:

```ts
type BlockingStatus = Extract<DataStatus, 'error' | 'offline'>;

const BLOCKING_TEXT = {
  error: {
    title: 'No podemos cargar las estaciones',
    body: 'El servicio de BiciMAD no está respondiendo. Suele ser temporal; no es un problema de tu conexión.',
    canRetry: true,
  },
  offline: {
    title: 'Sin conexión a internet',
    body: 'Necesitas conexión para ver las estaciones la primera vez. Se cargarán solas al volver a conectarte.',
    canRetry: false,
  },
} as const satisfies Record<BlockingStatus, { title: string; body: string; canRetry: boolean }>;
```

## Testing Strategy

- Vitest, Testing Library y MSW, como hoy, con temporizadores falsos para la cuenta atrás.
- `ErrorState`: título, texto, «Reintentar» con `aria-busy` mientras pide, pie fuera de la región `alert`; axe.
- `useDataStatus`: `nextRetryAt` a los 30, 60 y 120 s tras uno, dos y tres fallos, y sin valor tras un acierto.
- Lista y panel, por cada fila de la tabla «Estados y pantallas»: el texto, el rol y la acción en escritorio y en móvil; `offline` sin datos sin «Reintentar».
- Aviso `stale` con solo la lista completa `stale` y con solo las cercanas; hora de la más antigua.
- Buscador: desactivado con `error` y `offline` sin datos; placeholder de guardadas con `offline`; sin resultados con la sugerencia y «Ver estaciones cercanas» (borra y deja el foco); sin cercanas, sin sugerencia.
- Mapa: aviso flotante con `error`, capa con `offline` que desaparece al volver `online` sin desmontar el mapa, leyenda gris con `stale`.
- Ficha: fuera de servicio sin insignias, sin confirmar con su pie, no encontrada con «Volver a la lista», en tarjeta y panel.
- axe en cada estado de las dos pantallas.
- Cobertura ≥ 80 % por capa; `pnpm --filter web depcruise` sin violaciones.

## Boundaries

- **Siempre:** derivar cada aviso de `status`; un aviso por causa (no repetir en panel y mapa lo que ya dice la barra); `role="alert"` solo para lo que bloquea (`error`, `offline`) y `status` para el resto; la cuenta atrás nunca en una región viva; color nunca solo.
- **Preguntar antes:** cualquier dependencia; textos distintos de los de los supuestos; mover piezas de la composición de escritorio o móvil más allá de los avisos; tocar `api/`.
- **Nunca:** vaciar la pantalla si hay datos; reintentar más rápido que 30 s; búsqueda por nombre; hex fuera de `index.css`; estados de Bus.

## Success Criteria

1. SC1: con el API caído y sin datos, las dos pantallas muestran `ErrorState` con sus textos, «Reintentar» y la cuenta atrás real (30, 60 y 120 s); el buscador está desactivado y el mapa dice «Las estaciones aparecerán aquí cuando se recupere el servicio».
2. SC2: sin conexión y sin datos, `ErrorState` con los textos de conexión y sin «Reintentar».
3. SC3: con datos y un fallo, el aviso `stale` con la hora y «Reintentar» sale si cualquiera de las dos consultas está `stale`; en móvil el subtítulo pasa a ámbar; en escritorio el mapa lleva «Gris = dato sin confirmar».
4. SC4: sin conexión y con datos, la barra (escritorio) o el aviso (móvil) oscuro, «Últimos datos guardados» con su hora y la capa sobre el mapa; al volver la conexión todo vuelve sin recargar.
5. SC5: buscar «999» muestra el mensaje, la sugerencia de la cercana más próxima y «Ver estaciones cercanas» en el desplegable.
6. SC6: la ficha (tarjeta y panel) cubre fuera de servicio, sin confirmar y no encontrada según la alternativa A.
7. SC7: axe sin infracciones en cada estado de las dos pantallas; VoiceOver anuncia cada aviso una vez.
8. SC8: `pnpm check:task` pasa.

## Open Questions

Ninguna.

## Changelog

- 2026-11-09: borrador a partir del documento de diseño (revisión 32) y de los tableros de error del lienzo, con las decisiones 1 a 4 del usuario.
- 2026-11-09: supuesto 14 con los textos de los estados del tablero «Móvil — estación elegida» (no encontrada, error de carga y pie de fuera de servicio).
- 2026-11-09: el diseñador añade «Escritorio · sin conexión, sin datos» y «Error · sin conexión, sin datos»; supuestos 4 y 5 y la tabla siguen esos tableros (placeholder «Disponible al volver a conectarte», sin barra oscura). Se cierra la pregunta de esos textos.
- 2026-11-09: decisión 5 del usuario: cuenta atrás real, sin `Retry-After`, tras comprobar en el API que esa cabecera solo llega con el cupo agotado y el límite por IP.
- 2026-11-09: aprobada por el usuario.
- 2026-11-09: tras T7, el pie de la ficha con datos al día se queda con la forma larga de toda la app («Actualizado hace 30 segundos») en lugar del «30 s» del lienzo; la tarjeta de escritorio gana el pie del panel móvil.
