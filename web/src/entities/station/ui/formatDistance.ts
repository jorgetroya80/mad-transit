const METERS_PER_KILOMETER = 1000;

const metersFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 0 });
const kilometersFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

type Distance = { amount: string; isKilometers: boolean };

function measureDistance(meters: number): Distance {
  // Round first so 999.6 m reads "1 km", not "1000 m".
  const roundedMeters = Math.round(meters);
  if (roundedMeters < METERS_PER_KILOMETER) {
    return { amount: metersFormat.format(roundedMeters), isKilometers: false };
  }
  return {
    amount: kilometersFormat.format(roundedMeters / METERS_PER_KILOMETER),
    isKilometers: true,
  };
}

export function formatDistance(meters: number): string {
  const { amount, isKilometers } = measureDistance(meters);
  return `${amount} ${isKilometers ? 'km' : 'm'}`;
}

// Screen readers may read "m" as a letter, so the accessible name spells the unit out.
export function formatSpokenDistance(meters: number): string {
  const { amount, isKilometers } = measureDistance(meters);
  const [one, other] = isKilometers ? ['kilómetro', 'kilómetros'] : ['metro', 'metros'];
  return `${amount} ${amount === '1' ? one : other}`;
}
