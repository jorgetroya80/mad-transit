import { type ArrivalRef, isSameArrival } from '@/entities/bus-stop';
import { useState } from 'react';

// View state, not URL: the bus goes with its stop, and another arrival replaces it.
export function useShownArrival(number: string | undefined) {
  const [shownArrival, setShownArrival] = useState<ArrivalRef>();
  const [shownNumber, setShownNumber] = useState(number);
  if (shownNumber !== number) {
    setShownNumber(number);
    setShownArrival(undefined);
  }

  // Only the line and the destination identify the arrival; its position comes from the fresh data.
  const toggleOnMap = (arrival: ArrivalRef) =>
    setShownArrival((current) =>
      current && isSameArrival(current, arrival) ? undefined : arrival,
    );

  return { shownArrival, toggleOnMap };
}
