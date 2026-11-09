import { useState } from 'react';

type PendingAction = { isPending: boolean; run: () => void };

// A returned promise keeps the action pending until it settles; anything else is fire and forget.
export function usePendingAction(action: () => unknown): PendingAction {
  const [isPending, setIsPending] = useState(false);

  function run() {
    const pending = action();
    if (!(pending instanceof Promise)) return;
    setIsPending(true);
    const stop = () => setIsPending(false);
    void pending.then(stop, stop);
  }

  return { isPending, run };
}
