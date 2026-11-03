import { type Coordinates, useStationDetail } from '@/entities/station';
import { useNearbyTitle } from '../model/useNearbyTitle';

// The text of the hidden sheet's strip, and so its accessible name. Components rather than
// strings, so each one reads only the data its own case needs.

export function ListStripLabel({ center }: { center: Coordinates | undefined }) {
  return `Mostrar lista · ${useNearbyTitle(center).title}`;
}

// While loading or after an error there is no name yet: the number stands in, as in the header.
export function DetailStripLabel({ number }: { number: string }) {
  const detail = useStationDetail(number);
  const name =
    detail.status === 'not-found'
      ? 'Estación no encontrada'
      : (detail.station?.name ?? `Estación ${number}`);
  return `Mostrar detalle · ${name}`;
}
