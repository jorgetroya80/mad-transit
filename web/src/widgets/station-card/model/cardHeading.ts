import type { Station, StationDetailState } from '@/entities/station';

export type CardHeading = {
  title: string;
  // The number in the meta row, when there is one.
  metaNumber: string | undefined;
  // Only a station that exists has a distance and a star.
  station: Station | undefined;
};

// A missing station names its number in the meta and says so in the title. While loading or
// after an error there is no name yet: the number stands in as the title.
export function cardHeading(number: string, detail: StationDetailState): CardHeading {
  if (detail.status === 'not-found') {
    return { title: 'Estación no encontrada', metaNumber: number, station: undefined };
  }
  const { station } = detail;
  return { title: station?.name ?? `Estación ${number}`, metaNumber: station?.number, station };
}
