// `?station` may differ in case from the API's number (`1A` vs `1a`).
export function isSameStationNumber(number: string, wanted: string | undefined): boolean {
  return wanted !== undefined && number.toLowerCase() === wanted.toLowerCase();
}
