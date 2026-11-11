# Spec: web-ui-library

- Created: 2026-11-10
- Status: **implemented** (2026-11-11)
- Plan: [PLAN-web-ui-library.md](../plans/PLAN-web-ui-library.md)

Módulo `web-ui-library` del [Capability Map](CAPABILITY-MAP.md). Construye la sección «Librería de componentes» del documento «Mad Transit — Especificación de UI» y el tablero «Componentes reutilizables · librería genérica (16 piezas)» del lienzo «Mad Transit · rediseño», que son privados. El documento es el contrato de cada pieza (parámetros, colores por estado, medidas, accesibilidad y lo que no hace). Esta spec fija dónde vive la librería, qué se desvía del documento y cómo se comprueba. Las pantallas no cambian: eso lo hace `web-ui-migration`, el módulo siguiente.

## Objective

Tener en `shared/ui` una librería de piezas genéricas que sirva igual para BiciMAD, para el bus y para cualquier pantalla futura:

- Ninguna pieza sabe de estaciones, paradas, BiciMAD ni bus.
- Ningún texto fijo dentro de una pieza: todos llegan como parámetros, también los que solo oye el lector de pantalla («Borrar búsqueda», «Cerrar la ficha de la estación»).
- Las piezas grandes se montan con las pequeñas por composición (huecos con `ReactNode` y piezas compuestas como `Card.Header`), no con variantes de dominio.
- El aspecto es el del lienzo: cada pieza en cada estado dibujado.

Quien la usa es el equipo, al construir pantallas. El usuario de la app no ve nada nuevo con este módulo.

## Decisiones (2026-11-10, del usuario)

1. **Dos módulos:** `web-ui-library` (librería, sin tocar pantallas) y `web-ui-migration` (las pantallas pasan a usarla y se retira lo viejo).
2. **Antes de `web-bus`**, que monta sus pantallas con `Tag`, `Card` y `ListItem`.
3. **Piezas genéricas, textos por parámetro y composición**, como pide el prompt enviado al diseñador.

## Alcance

| Grupo | Piezas |
| --- | --- |
| Base | tokens `tone-*` y escalas nuevas, `Icon` (21 nombres), `Spinner`, tipo `Tone` |
| Controles | `Button`, `IconButton`, `SegmentedControl`, `SearchField`, `Disclosure`, `ControlGroup` |
| Avisos | `Banner`, `EmptyState`, `StatusText` |
| Datos | `CountBadge`, `Tag`, `StatTile`, `Legend`, `ListItem`, `Card` (`Card.Header`, `Card.Body`, `Card.Footer`) |
| Mapa | `drawMapPoint()` y `mapPointImageId()` (`MapPoint`, imagen en `canvas`, sin HTML) |
| Revisión | página `/dev/components`, solo en desarrollo y temporal (supuesto 15) |

## Assumptions

Supuestos donde el documento no basta o no encaja con el código. Corrígelos ahora o sigo con ellos.

1. **Una carpeta por pieza** en `web/src/shared/ui/<kebab-case>/` con su `index.ts`, exportada desde `shared/ui/index.ts`. Las piezas viejas (`CollapsibleSection`, `StatusBanner`, `ErrorState`, `MapControls`, `UpdatedIndicator`, `StateMessage`) se quedan hasta `web-ui-migration`. Los nombres nuevos no chocan con ellas, así que conviven.
2. **Los tokens viejos pasan a ser alias de los nuevos**, como pide el documento: los `tone-*` llevan el hex y `availability-*`, `notice-*` y `primary-*` pasan a valer `var(--color-tone-…)`. Así cada color existe una sola vez. `readMapColors()` (`mapColors.ts`) sigue funcionando, porque `getComputedStyle` devuelve el valor ya resuelto, y sus tests ponen los tokens a mano sin cargar `index.css`. Solo es alias un token viejo cuyo hex coincide con el de su `tone-*`; si alguno difiere, se queda con su valor y se apunta en el changelog del plan, para que la pantalla no cambie de color. Los alias se retiran en `web-ui-migration`, cuando ya nadie los lea.
3. **Tokens nuevos**, todos en `web/src/app/styles/index.css`:
   - `--color-tone-<tono>` con `-foreground`, `-soft`, `-soft-foreground`, `-line`, `-soft-line`, `-icon` y `-label`, para los 7 tonos. Solo se crean los que tienen valor propio en la tabla «Base común · tonos» (unos 40, no 7 × 8). Donde el documento dice «igual que `solid`» (el `soft` de `muted` e `inverse`), la pieza usa el token `solid`.
   - `--color-tone-warning-dot`, `--color-surface-disabled`, `--color-line-subtle`, `--color-tag`, `--color-tag-inverse` y `--color-tag-ring`.
   - `--text-caption`, `-meta`, `-body`, `-label`, `-input`, `-title`, `-title-lg` y `-stat`, cada uno con su tamaño, `--line-height` y `--font-weight`, para que una sola clase (`text-label`) deje el texto completo. Si una pieza necesita otro peso (el segmento elegido va a 700), lo pone encima (`font-bold`). Los dos de hoy (`text-sheet-title` y `text-sheet-subtitle`) se quedan solo con el tamaño en este módulo (decisión del usuario en T1): con el interlineado del documento, la cabecera del panel móvil bajaría unos 5 px (25,5 → 22 y 19,5 → 18 px de línea). Su interlineado y peso entran en `web-ui-migration`.
   - `--radius-segment`, `-float` y `-tag`. No se crea `--radius-full`: Tailwind ya trae `rounded-full`.
   - `--shadow-segment` y `--shadow-pill`.
   - Ninguno de espaciado: los pasos de 2 px ya existen en Tailwind (`p-2.5` = 10 px, `gap-1.5` = 6 px).

   Donde el lienzo y el documento difieren, gana el documento (por ejemplo, `radius-float` = 14 px y no los 12 de `radius-card`).
4. **`Icon`** con `name` y `size` sustituye a los 14 componentes de icono de hoy, que se quedan hasta la migración. Siempre `aria-hidden`. Decisiones del usuario (2026-11-10):
   - **Dibujos:** todos salen del SVG del lienzo, también los 13 que ya existen. En la migración se notará en pantalla. Si un nombre no tiene dibujo en ningún tablero, se queda el del código y se apunta en el changelog del plan.
   - **Nombres, 21:** los 18 del documento, `star-filled` (abajo), `arrow-left` (el «volver» de hoy, una flecha) y `warning` (el triángulo del error de carga de la ficha), para que la migración pueda seguir usándolos. `chevron-left` también existe. Son dos dibujos distintos (flecha y ángulo) y la librería tiene los dos; cuál usa «volver» lo decide `web-ui-migration` (el documento pide elegir uno; el lienzo usa `chevron-left`).
   - **Estrella:** `star` (contorno) y `star-filled` (relleno), para que `IconButton.pressedIcon` reciba un nombre.
   - **Tamaños:** lista cerrada de los que se usan, `16 | 18 | 20 | 22 | 24 | 30 | 34`, con 20 por defecto.
   - **Trazo:** el del documento. 2 por defecto, 2,2 en cerrar, flechas y centrar, y 2,4 en las flechas de 16. `Icon` lo elige según el nombre y el tamaño.
5. **`MapPoint`**, decisiones del usuario (2026-11-10). Los puntos se dibujan en un `canvas` y se registran como imagen de la capa, como hoy en `pointImage.ts`.
   - **API del documento (rev 52, opción A del usuario):** la librería exporta `drawMapPoint(ctx, params, pixelRatio)`, que dibuja el punto en el `canvas`, y `mapPointImageId(params)`, el id de la imagen. Parámetros: `tone`, `value` o `icon`, `shape` (`circle` | `square`), `fill` (`tone` | `tag`) y `selected`. La pantalla registra la imagen con `map.addImage` en `styleimagemissing`, como hoy.
   - **Colores leídos fuera:** `drawMapPoint` no lee el CSS. Recibe los colores `tone-*` en `params` o en un objeto de estilo, leídos una vez como hoy `readMapColors()`. Así los tests dibujan sobre un pintor falso sin `getComputedStyle`.
   - **Pinta círculo y cuadrado:** el círculo con cifra (estaciones) y el cuadrado con esquinas redondeadas (`roundRect`) con icono por `Path2D` (paradas) quedan hechos y probados en este módulo. `pointImage.ts` sigue como está hasta `web-ui-migration`, que lo sustituye por `drawMapPoint`. Si la parada lleva número y desde qué zoom se ve se decide en `web-bus`. El documento recomienda icono sin número desde zoom 15: hay unas 4.935 paradas y un número de 4 cifras no cabe en 32 px.
   - **Posición del usuario fuera de la librería**, como dice el documento: sigue siendo la capa `circle` de `base-map`, y sus medidas nuevas (punto de 12, borde blanco de 2, halo de 22 al 18 %) se aplican en `web-ui-migration`.
   - **Medidas del documento:** halo de 2 px (hoy 1,5), anillo de seleccionado de 4 px (hoy 3), cifra de 15 px (hoy 14) y `muted` sin halo. Se notan en pantalla al migrar. La cifra espera a la fuente (`document.fonts.load('700 15px Inter')`) antes de dibujarse.
   - **Iconos como datos:** cada dibujo de `Icon` (supuesto 4) se guarda como lista de trazos `d`, con los círculos y rectángulos pasados a trazo. `<Icon>` los pinta como SVG y el `canvas` del mapa como `Path2D`, así los dos usan el mismo dibujo. No se usa el icono `bus` del sprite de OpenFreeMap: no se puede recolorear, no es el dibujo del lienzo y puede cambiar sin aviso.
   - `pointImage.ts` no se cambia en este módulo.
6. **Borde de `danger` en el mapa continuo**, como hoy (decisión del usuario, 2026-11-10), aunque el `canvas` permitiría discontinuo. El documento (rev 52) lo recoge como decisión de diseño. La pista sin color en el mapa es la cifra «0». `Legend` gana `lineStyle?: 'solid' | 'dashed'` por muestra, para que la leyenda del mapa pinte «Vacía» continua como el punto; `CountBadge` y `StatTile` siguen discontinuos.
7. **Desajustes del documento con el código**, que se piden corregir al diseñador (Open Questions 2):
   - `--color-input-line` ya vale `#7d8794` desde `web-design-tokens`, así que sobra la nota de «token a corregir».
   - El nombre accesible de la estrella ya es «Favorita» en las dos pantallas, con un tooltip «Añadir a favoritas» / «Quitar de favoritas» (decisión del usuario en `web-redesign-desktop`, 2026-11-02; `FavoriteButton.tsx`). Para conservarlo, `IconButton` gana un parámetro opcional `tooltip: string`, que se pinta como `title` y no cambia el nombre accesible (`label`). El documento lo recoge desde la rev 54.
8. **`Button` sin variante de enlace**, como dice el documento desde la rev 52. Hoy el único enlace de la web es el texto de la atribución del mapa (`DataAttribution`), que no tiene aspecto de botón. Se añade cuando haga falta.
9. **`Disclosure` y el foco** (decisiones del usuario, 2026-11-10):
   - **No guarda si está abierta**, como dice el documento. `CollapsibleSection` lo guarda hoy por dentro (`favorites-section-open`). En la migración, `FavoriteStations` usa `useLocalStorage` con la misma clave y pasa `open` y `onOpenChange`, así que el usuario no nota nada.
   - **Encabezados enfocables por código:** los encabezados de `Disclosure`, `Card.Header` y `EmptyState` llevan siempre `tabIndex={-1}`, sin anillo de foco en el encabezado. No añaden paradas de Tab y dejan que una pantalla mueva el foco allí, como hace hoy `useListFocusReturn` al cerrar la ficha (hoy lo hacen `CollapsibleSection`, `StationSection` y `SheetCardHeader`). El documento no lo dice.
   - `Disclosure` mantiene el contenedor `<section aria-labelledby>` de hoy, porque el documento dice que los criterios de «CollapsibleSection» siguen valiendo.
10. **Ningún texto con valor por defecto** (decisiones del usuario, 2026-11-10). Un texto que falta es un error de TypeScript, no un texto en inglés ni uno inventado.
    - **Siempre obligatorios:** los que dan nombre o sentido a la pieza: `label` de `Button`, `IconButton`, `ControlGroup` y del grupo y cada opción de `SegmentedControl`; `label` y `clearLabel` de `SearchField`; `title` de `Disclosure`, `Card.Header` y `ListItem`; `message` de `Banner`; `title` y `message` de `EmptyState`; `value` y `label` de `StatTile`; `value` de `CountBadge`; `label` de `Tag`; `text` de `StatusText`; `label` y el `text` de cada muestra de `Legend`.
    - **Obligatorios según el caso**, con tipos de dos variantes: `accessibleLabel` de `ListItem` cuando llega `onSelect`; `busyLabel` de `ListItem` y de `Card.Body` cuando `busy` es `true` (texto oculto junto al `Spinner`, porque `aria-busy` no se anuncia); el `label` de la acción de `Banner` y `EmptyState` cuando hay acción.
    - **Opcionales**, sin texto inventado si no llegan: `hint`, `error`, `placeholder`, `title` de `Banner`, `note`, `description`, `subtitle`, `leadingText`, `meta`, `statusLabel`, `srText`, `count` y `tooltip`.
    - Lo que no es texto (tono, tamaño, variante) tiene el valor por defecto del documento.
11. **Regiones vivas** (decisiones del usuario, 2026-11-10). Solo `Banner` (`announce`), `EmptyState` (`announce`, `alert` por defecto) y `StatusText` (`live`) pueden ser regiones vivas, y quien los usa decide. Ninguna otra pieza anuncia nada. Así se mantiene la regla de `web-error-states`: un aviso por causa.
    - **Etiqueta:** `polite`/`status` se pinta como `<output>`, porque oxlint (`prefer-tag-over-role`) rechaza `role="status"`, como ya pasa en `NoResults`, `MapNotice` y `CardBody`. `assertive`/`alert` se pinta como `<div role="alert">`.
    - **Solo el texto dentro:** la región viva contiene el título y el mensaje. La acción, `note` y `children` quedan fuera, y `note` nunca es viva, porque ahí va la cuenta atrás. Es lo que hace hoy `ErrorState`.
    - **`EmptyState` con `status`:** `<output>` solo admite contenido en línea, así que envuelve el mensaje y el `<h2>` queda fuera, como hace hoy `NoResults`. Con `alert`, el `<h2>` y el mensaje van dentro.
12. **Hover y foco** (decisiones del usuario, 2026-11-10):
    - **Hover solo con puntero:** la variante `hover:` de Tailwind 4 ya aplica `@media (hover: hover)`, y `index.css` no la cambia. Pulsado con `active:`, sin cambio de tamaño.
    - **Anillo de foco de 2 px**, como hoy, no de 3 px como dice el documento: 2 px `primary` a 2 px de distancia. El documento lo recoge desde la rev 54.
    - **Una sola definición:** `@utility focus-ring { &:focus-visible { outline: 2px solid var(--focus-ring-color, var(--color-primary)); outline-offset: 2px } }` en `index.css`, y todas las piezas interactivas usan la clase `focus-ring`. Sustituye a la constante `FOCUS_RING`, hoy copiada en `NeedToggle`, `SearchInput` y `FavoriteButton`; esas copias se retiran en `web-ui-migration`.
    - **Anillo blanco sobre fondo oscuro, preparado ya:** el anillo `primary` sobre `tone-inverse` (`#14181f`) da 2,7:1 y WCAG 1.4.11 pide 3:1. El `Banner` `inverse` pone `--focus-ring-color` a `var(--color-tone-inverse-foreground)`, blanco (17,8:1), sin hex fuera de `index.css`, así que cualquier botón que algún día lleve dentro sale bien. Hoy no tiene acción.
13. **`Card` compuesta** (decisiones del usuario, 2026-11-10):
    - **Una sola forma:** `Card.Header`, `Card.Body` y `Card.Footer`, montadas con `Object.assign(CardRoot, { Header, Body, Footer })`. No se exportan sueltas. Sin contexto de React: las partes no se comunican entre sí.
    - **`busy` y `busyLabel` van en `Card.Body`**, no en `Card` como dice el documento: es el cuerpo el que se cambia por el `Spinner`, y así no hace falta contexto.
    - **`onEscape?: () => void` en `Card`:** monta por dentro el listener de `keydown` de hoy (`useCloseOnEscape`, que se mueve en este módulo de `widgets/station-card/model` a `shared/lib`; el widget solo cambia su `import`, sin cambio de comportamiento), porque jsx-a11y rechaza `onKeyDown` en un `<section>`. Sin trampa de foco.
14. **Commit y release:** `refactor(web)` (decisión del usuario, 2026-11-10), porque nada cambia para el usuario: release-please no abre release y Render no se despliega, como con el PR #86. La release de web llega con `web-ui-migration`. Las piezas que nadie importa no entran en el bundle; lo único que entra siempre es lo de `index.css` (tokens y `focus-ring`, menos de 2 KB). Si el floor guard avisa al mover el test de `useCloseOnEscape`, se explica en el cuerpo del commit.

15. **Página `/dev/components`** (decisión del usuario, 2026-11-10) para revisar la librería a ojo contra el tablero antes de migrar:
    - Vive en `pages/dev-components/`, donde sí pueden ir los textos de ejemplo del documento con palabras de dominio. Muestra cada pieza en cada estado, agrupadas como en el tablero, y se mira a 1440 y a 390 px.
    - La ruta solo se registra con `import.meta.env.DEV` en `app/router.tsx` y la página se carga con `import()`, así que el build de producción no la incluye. El plan lo comprueba buscando un texto de la página en `dist/`.
    - Un test monta la página entera y pasa axe: es la prueba que ve todas las piezas juntas.
    - Es temporal: se elimina en `web-ui-migration`, cuando la migración termine.

## Tech Stack

El de [web-redesign-components](SPEC-web-redesign-components.md#tech-stack): React 19.3, Tailwind 4.3 (`@theme static`), Vitest 5, Testing Library y axe-core. Sin dependencias nuevas: nada de Radix, Headless UI, `clsx` ni Storybook.

## Commands

```bash
pnpm --filter web test
pnpm --filter web test:coverage
pnpm --filter web depcruise
pnpm --filter web lint
pnpm --filter web build
pnpm check:task
```

## Project Structure

```
web/src/app/styles/index.css           tokens tone-*, tag-*, text-*, radius-*, shadow-* nuevos
web/src/shared/ui/
  tone/                                 tipo Tone, toneLineStyle (continuo o discontinuo)
  icons/                                + Icon (name, size) y los dibujos que faltan
  spinner/                              Spinner (gira 1 vuelta/s; quieto con movimiento reducido)
  button/  icon-button/  segmented-control/  search-field/  disclosure/  control-group/
  banner/  empty-state/  status-text/
  count-badge/  tag/  stat-tile/  legend/  list-item/  card/
  map-point/                            drawMapPoint(), mapPointImageId() y sus tipos
  index.ts                              exporta todo lo anterior
web/src/shared/lib/                     + useCloseOnEscape (desde widgets/station-card/model)
web/src/pages/dev-components/           página de revisión, solo en desarrollo (temporal)
web/src/app/router.tsx                  + ruta /dev/components con import.meta.env.DEV
```

`shared` no importa de `entities`, `features`, `widgets` ni `pages` (depcruise). La traducción de nivel a tono (`availabilityTone()`) no entra aquí: va en `entities/station` en `web-ui-migration`.

## Code Style

El de [web-redesign-components](SPEC-web-redesign-components.md#code-style): clases enteras en mapas con `satisfies` (nunca clases montadas por partes, que Tailwind no ve), funciones de 3 parámetros como máximo y `complexity` ≤ 10 (oxlint), sin hex fuera de `index.css`. Cada pieza recibe sus textos y su tono; los huecos son `ReactNode`:

```tsx
const BADGE_TONE = {
  success: 'bg-tone-success text-tone-success-foreground border-tone-success',
  warning: 'bg-tone-warning text-tone-warning-foreground border-tone-warning',
  danger: 'bg-surface text-tone-danger-foreground border-tone-danger-line border-dashed',
  neutral: 'bg-tone-neutral text-tone-neutral-foreground border-tone-neutral',
  muted: 'bg-tone-muted text-tone-muted-foreground border-tone-muted-line',
  info: 'bg-tone-info text-tone-info-foreground border-tone-info',
} as const satisfies Record<BadgeTone, string>;

type CountBadgeProps = { value: string; tone: BadgeTone; size?: 'md' | 'sm'; srText?: string };

export function CountBadge({ value, tone, size = 'md', srText }: CountBadgeProps) {
  return (
    <span className={`${BADGE_BASE} ${BADGE_SIZE[size]} ${BADGE_TONE[tone]}`}>
      <span aria-hidden={srText ? true : undefined}>{value}</span>
      {srText && <span className="sr-only">{srText}</span>}
    </span>
  );
}
```

Los textos de ejemplo de los tests son los del documento: muestran que la pieza sirve para BiciMAD y para el bus.

## Testing Strategy

- Un archivo de test por pieza, junto a ella, con Vitest y Testing Library.
- **Cada estado del documento tiene su test:** normal, seleccionado o alternado, desactivado, ocupado, error, cargando, plegado o desplegado, según la pieza. El test comprueba el atributo que lo expresa (`aria-pressed`, `aria-current`, `aria-expanded`, `aria-busy`, `aria-disabled`, `aria-invalid`, `disabled`, `hidden`) y la clase de color de su tabla.
- **axe** (`expectNoAxeViolations`) en cada estado. jsdom no mide contraste: los contrastes son los del documento y se revisan a mano (ver SC7).
- **Textos por parámetro:** cada pieza se monta con textos de dos dominios (los ejemplos del documento) y el test busca esos textos en el nombre accesible (`getByRole(…, { name })`). Un test por carpeta recorre los `.tsx` de la librería y falla si aparece «estación», «parada», «BiciMAD», «bici» o «autobús». `bus` y `bike` solo valen como nombres de icono.
- `Banner` `inverse` define `--focus-ring-color` blanco; los demás tonos no lo tocan.
- Regiones vivas: `Banner`, `EmptyState` y `StatusText` en cada valor de `announce`/`live` (`<output>`, `role="alert"` o ninguna); la acción y `note` fuera de la región, y `EmptyState` con `status` con el `<h2>` fuera del `<output>`.
- Encabezados de `Disclosure`, `Card.Header` y `EmptyState`: aceptan `focus()` y no están en el orden de Tab.
- `IconButton` con `tooltip`: el `title` lleva el texto y el nombre accesible sigue siendo `label`, pulsado o no.
- `Card`: `onEscape` se llama con Escape desde cualquier control de dentro; `Card.Body` con `busy` muestra el `Spinner` y su `busyLabel` oculto.
- **Composición:** `Card` con `StatTile` y con `ListItem` + `Tag`; `ListItem` con `CountBadge` y con un `IconButton` en `trailing` (estática, sin botones anidados); `Banner` y `EmptyState` con `Button` ocupado.
- **Teclado:** Tab y Enter/Espacio en `SegmentedControl`, `Disclosure`, `ListItem` pulsable e `IconButton`; Escape con texto en `SearchField` borra y deja el foco en la caja.
- `drawMapPoint()` sobre un pintor falso: una tabla de casos (6 tonos × normal y seleccionado, círculo con cifra, cuadrado con icono y `fill="tag"`) que comprueba forma, tamaño, colores, halo, anillo y que `danger` va continuo y `muted` sin halo. `mapPointImageId()` da un id distinto por combinación y el mismo para la misma.
- `Icon`: cada nombre pinta sus trazos en el SVG, y los mismos datos sirven para construir un `Path2D` (el test comprueba que cada trazo es un `d` válido).
- `/dev/components`: la página entera pasa axe; la ruta existe en desarrollo y no en el build de producción (ningún texto de la página en `dist/`).
- Cobertura ≥ 80 % en `shared`; depcruise sin violaciones; ningún test de pantalla cambia (el floor guard no avisa de ninguna aserción reescrita).

## Boundaries

- **Siempre:** textos y tono por parámetro; huecos `ReactNode` para el contenido libre; HTML nativo (`button`, `fieldset`, `input type="search"`, `hN`) antes que `role`; objetivo táctil de 44 px (con `::after` en `Button sm` y `pill`); color nunca como única pista.
- **Preguntar antes:** cualquier dependencia; cambiar un color, medida o texto de ejemplo respecto al documento; tocar una pantalla, un widget o una entidad (salvo el `import` de `useCloseOnEscape` y la ruta de desarrollo de `/dev/components`); retirar una pieza o un token viejo (eso es `web-ui-migration`).
- **Nunca:** palabras de dominio en `shared/ui`; un texto por defecto o en inglés; regiones vivas fuera de `Banner`, `EmptyState` y `StatusText`; hex fuera de `index.css`; trampas de foco.

## Success Criteria

1. SC1: `shared/ui` exporta `Icon`, `Spinner`, `drawMapPoint`, `mapPointImageId` y las 15 piezas de HTML, con los parámetros de las tablas del documento (salvo los supuestos 5, 7, 9 a 13).
2. SC2: ninguna pieza tiene texto fijo; el test de palabras de dominio pasa y TypeScript exige cada texto que da nombre accesible.
3. SC3: cada estado del documento tiene un test que comprueba su atributo y su color, y axe no da infracciones en ninguno.
4. SC4: los tokens nuevos están en `index.css` y los de hoy valen lo mismo, como alias o con su valor (supuesto 2); ningún test de pantalla cambia y la app se ve como antes.
5. SC5: `pnpm --filter web depcruise` sin violaciones: `shared` no importa de capas superiores.
6. SC6: `pnpm check:task` pasa, con la cobertura de `shared` ≥ 80 %.
7. SC7: en `/dev/components`, cada pieza en cada estado coincide con el tablero a 1440 y a 390 px (revisión del usuario), y la página no está en el build de producción.

## Open Questions

Ninguna. El documento se revisó en la rev 54, que ya recoge el `tooltip` de `IconButton` (supuesto 7) y el anillo de foco de 2 px (supuesto 12).

## Changelog

- 2026-11-10: borrador a partir de la sección «Librería de componentes» del documento y del tablero del lienzo; decisiones 1 a 3 del usuario. Pasa a in review.
- 2026-11-10: revisión del usuario. Supuesto 2: los tokens viejos pasan a ser alias de los `tone-*`, como pide el documento, solo donde el hex coincide. Supuesto 3: solo los tokens de color con valor propio, `text-*` con tamaño, interlineado y peso, y sin `--radius-full` (`rounded-full` de Tailwind).
- 2026-11-10: supuesto 4 (decisiones del usuario): todos los dibujos del lienzo, 21 nombres (+ `star-filled`, `arrow-left`, `warning`), `star` y `star-filled`, tamaños `16 | 18 | 20 | 22 | 24 | 30 | 34` y trazo del documento.
- 2026-11-10: supuesto 5 (decisiones del usuario): `mapPointStyle(params, colors)` pura; el pintor la usa en la migración y el cuadrado de parada se pinta en `web-bus`; `userLocationStyle()` aparte; medidas del documento; iconos guardados como trazos para SVG y `Path2D`.
- 2026-11-10: supuesto 6 (decisión del usuario): borde `danger` continuo en el mapa, como hoy. Se pide al diseñador que ajuste el documento y el lienzo a las restricciones de la librería.
- 2026-11-10: supuesto 7 (decisión del usuario): `IconButton` gana `tooltip` para conservar el tooltip de la estrella; las dos correcciones van al diseñador.
- 2026-11-10: revisión del documento rev 52 y del tablero (21 iconos dibujados). Decisiones del usuario: se mantiene `tooltip`; `MapPoint` con la API del documento (`drawMapPoint`, `mapPointImageId`), que pinta círculo y cuadrado con icono en este módulo; posición del usuario fuera de la librería; `arrow-left` y `chevron-left` los dos, la migración elige; `text-sheet-*` ganan interlineado y peso. `Legend` gana `lineStyle`.
- 2026-11-10: supuesto 8 coincide ya con el documento. Supuesto 9 (decisiones del usuario): `Disclosure` controlada desde fuera con la misma clave de `localStorage`; encabezados de `Disclosure`, `Card.Header` y `EmptyState` con `tabIndex={-1}`.
- 2026-11-10: supuesto 10 (decisiones del usuario): lista de textos obligatorios, obligatorios según el caso (con tipos de dos variantes, `busyLabel` nuevo en `ListItem` y `Card`) y opcionales.
- 2026-11-10: supuesto 11 (decisiones del usuario): `<output>` para `status`, solo el texto dentro de la región viva y `note` fuera, `EmptyState` con `status` deja el `<h2>` fuera.
- 2026-11-10: supuesto 12 (decisiones del usuario): anillo de foco de 2 px como hoy, en una utilidad `focus-ring` de `index.css`, con anillo blanco ya preparado dentro del `Banner` `inverse`.
- 2026-11-10: supuesto 13 (decisiones del usuario): solo `Card.Header`/`Body`/`Footer`; `busy` en `Card.Body`; `onEscape` en `Card` con `useCloseOnEscape` movido a `shared/lib`.
- 2026-11-10: supuesto 14: `refactor(web)`, sin release. Supuesto 15 (decisión del usuario): página `/dev/components` solo en desarrollo, que se elimina al terminar `web-ui-migration`. Sin preguntas abiertas.
- 2026-11-10: el documento (rev 54) recoge el `tooltip` de `IconButton` y el anillo de foco de 2 px.
- 2026-11-10: aprobada por el usuario.
- 2026-11-11: implementada en el PR #112 (`refactor(web)`, sin release). SC1 a SC7 comprobados, con la revisión visual del usuario en `/dev/components`.
