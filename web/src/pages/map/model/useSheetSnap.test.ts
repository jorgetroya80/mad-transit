import { act, renderHook } from '@testing-library/react';
import { useSheetSnap } from './useSheetSnap';

function renderSheetSnap(initialStation?: string) {
  return renderHook(({ station }) => useSheetSnap(station), {
    initialProps: { station: initialStation },
  });
}

describe('useSheetSnap', () => {
  it('starts at half, with or without a station', () => {
    expect(renderSheetSnap().result.current.snap).toBe('half');
    expect(renderSheetSnap('1a').result.current.snap).toBe('half');
  });

  it('cycles the list peek → half → full → half', () => {
    const { result } = renderSheetSnap();

    expect(result.current.nextSnap).toEqual({ peek: 'half', half: 'full', full: 'half' });
  });

  it.each([
    ['peek', 'Ampliar lista'],
    ['half', 'Ampliar lista'],
    ['full', 'Reducir lista'],
  ] as const)('names the handle at %s "%s"', (snap, handleLabel) => {
    const { result } = renderSheetSnap();

    act(() => result.current.setSnap(snap));

    expect(result.current.snap).toBe(snap);
    expect(result.current.handleLabel).toBe(handleLabel);
  });

  it('goes from peek to half when a station gets selected', () => {
    const { result, rerender } = renderSheetSnap();
    act(() => result.current.setSnap('peek'));

    rerender({ station: '1a' });

    expect(result.current.snap).toBe('half');
  });

  it('keeps full when a station gets selected', () => {
    const { result, rerender } = renderSheetSnap();
    act(() => result.current.setSnap('full'));

    rerender({ station: '1a' });

    expect(result.current.snap).toBe('full');
  });

  it('stays at peek when the station gets closed', () => {
    const { result, rerender } = renderSheetSnap('1a');
    act(() => result.current.setSnap('peek'));

    rerender({ station: undefined });

    expect(result.current.snap).toBe('peek');
  });
});
