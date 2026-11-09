import { act, renderHook } from '@testing-library/react';
import { usePendingAction } from './usePendingAction';

function noop() {}

// Promise.withResolvers is ES2024; the project targets ES2022.
function deferred() {
  let resolve: () => void = noop;
  let reject: (reason: Error) => void = noop;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('usePendingAction', () => {
  it('is pending until the returned promise resolves', async () => {
    const { promise, resolve } = deferred();
    const { result } = renderHook(() => usePendingAction(() => promise));

    act(() => result.current.run());
    expect(result.current.isPending).toBe(true);

    await act(async () => resolve());
    expect(result.current.isPending).toBe(false);
  });

  it('stops being pending when the promise rejects', async () => {
    const { promise, reject } = deferred();
    const { result } = renderHook(() => usePendingAction(() => promise));

    act(() => result.current.run());
    await act(async () => reject(new Error('failed')));

    expect(result.current.isPending).toBe(false);
  });

  it('is never pending for an action that returns no promise', () => {
    const action = vi.fn<() => void>();
    const { result } = renderHook(() => usePendingAction(action));

    act(() => result.current.run());

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.isPending).toBe(false);
  });
});
