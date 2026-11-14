# Plan: web — el mapa no se mueve al cerrar la parada o la estación

- Created: 2026-11-14
- Status: **implemented** (2026-11-14)
- Spec: [SPEC-web-bus.md](../specs/SPEC-web-bus.md), [SPEC-web-bicimad.md](../specs/SPEC-web-bicimad.md)

## Problema

Al cerrar una parada de bus (botón del popup, `Escape`, cerrar el detalle o atrás), el mapa vuelve a la ubicación del usuario. En BiciMAD pasa lo mismo al cerrar la estación. El mapa debe quedarse donde está.

## Causa

`BusStopsMap.tsx` y `StationsMap.tsx` calculan `focus = selected && focusSelected ? selected : mapCenter`. Al cerrar, la selección desaparece de la URL y `focus` pasa de la selección a `mapCenter`. `useEaseTo` (`shared/ui/base-map/useMapLibre.ts`) ve coordenadas nuevas y llama a `easeTo` hacia el usuario.

## Solución

Un hook `useKeptFocus(selectedFocus, mapCenter)` en `shared/lib/geo`, junto a `useUserFocus`, que usan los dos mapas:
- Con selección enfocada devuelve la selección y la recuerda.
- Al quitarla, sigue devolviendo la última selección mientras `mapCenter` no cambie, así que `useEaseTo` ve los mismos números y el mapa no se mueve.
- En cuanto `mapCenter` cambia ("Mi ubicación" lo pasa a `undefined` y luego a la respuesta), suelta la selección y devuelve `mapCenter`.

Estado ajustado durante el render, como `useUserFocus`, sin efectos. `BaseMap`, `useEaseTo` y las páginas no cambian. Sin cambios en los SPEC: el comportamiento se explica en el cuerpo del PR.

Casos que no cambian:
- Primera carga sin selección: centra en el usuario.
- Abrir o cambiar la selección: centra en ella.
- "Mi ubicación" con algo abierto: sigue al usuario (`focusSelected` a false).
- `?station` que no está entre las estaciones: centra en `center`.
- Bus, "Ver en el mapa": al cerrar ya no hay `fitPoints` y el foco guardado es la parada, así que el mapa no salta al usuario.

## Tareas

Rama `fix/web-close-keeps-map`, un commit por tarea, un PR `fix(web)` que solo toca `web/`.

- [x] **T1: bus.** Test primero en `BusStopsMap.test.tsx`:
  - con `?stop=73`, `popup.onClose()` deja `focus` en la parada 73 (`{ lng: -3.704, lat: 40.4172 }`), no en `SOL`. Falla hoy;
  - después de cerrar, re-renderizar con `mapCenter` `undefined` y luego `USER`: `focus` pasa a `USER`.

  Después, `useKeptFocus` en `shared/lib/geo` (exportado desde `shared/lib`) y su uso en `BusStopsMap.tsx`.
  - Aceptación: cerrar no cambia `focus`; "Mi ubicación" después de cerrar centra en el usuario; los tests existentes siguen en verde.
  - Verificación: `pnpm check:task` en verde.
- [x] **T2: BiciMAD.** Test primero en `StationsMap.test.tsx`: quitar `?station` deja `focus` en la estación; un `center` nuevo después de cerrar lo mueve. Después, `useKeptFocus` en `StationsMap.tsx`.
  - Aceptación: igual que T1; "centers on the given center while ?station is not among the stations" sigue en verde.
  - Verificación: `pnpm check:task` en verde.
- [x] **Prueba a mano** en `vite`, escritorio y móvil: bus (X, `Escape`, "Volver") y BiciMAD (cerrar la estación, atrás). El mapa no se mueve y "Mi ubicación" sí lo mueve.
- [x] **Checkpoint:** revisión del diff. Preguntar antes de push y PR.

## Changelog

- 2026-11-14: borrador. Decisiones del usuario: BiciMAD también, sin cambios en los SPEC (solo en el PR), tareas dentro del plan.
- 2026-11-14: T1 hecha (8e7e0f3). `useKeptFocus` en `shared/lib/geo`, usado en `BusStopsMap`. Dos tests: cerrar mantiene el foco (fallaba con el foco en `SOL`) y un `mapCenter` nuevo después de cerrar vuelve al usuario. `pnpm check:task` en verde.
- 2026-11-14: T2 hecha (0eb3227). `useKeptFocus` en `StationsMap`. Dos tests: cerrar mantiene el foco en la estación (fallaba con el foco en `SOL`) y un `center` nuevo después de cerrar lo mueve. `pnpm check:task` en verde.
- 2026-11-14: prueba a mano hecha por el usuario en escritorio y móvil: el arreglo funciona. Plan implementado.
