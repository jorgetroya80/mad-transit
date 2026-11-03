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

  it.each([
    [undefined, 'Ocultar lista'],
    ['1a', 'Ocultar detalle'],
  ] as const)('names the handle with station %s "%s"', (station, hideLabel) => {
    expect(renderSheetSnap(station).result.current.hideLabel).toBe(hideLabel);
  });

  it.each(['hidden', 'half'] as const)('opens a station at half from %s', (listSnap) => {
    const { result, rerender } = renderSheetSnap();
    act(() => result.current.setSnap(listSnap));

    rerender({ station: '1a' });

    expect(result.current.snap).toBe('half');
    expect(result.current.hideLabel).toBe('Ocultar detalle');
  });

  it.each(['hidden', 'half'] as const)(
    'goes back to the list at %s when the station gets closed',
    (listSnap) => {
      const { result, rerender } = renderSheetSnap();
      act(() => result.current.setSnap(listSnap));
      rerender({ station: '1a' });
      act(() => result.current.setSnap(listSnap === 'half' ? 'hidden' : 'half'));

      rerender({ station: undefined });

      expect(result.current.snap).toBe(listSnap);
      expect(result.current.hideLabel).toBe('Ocultar lista');
    },
  );

  it('keeps the height and the remembered list height when another station opens', () => {
    const { result, rerender } = renderSheetSnap();
    act(() => result.current.setSnap('hidden'));
    rerender({ station: '1a' });
    expect(result.current.snap).toBe('half');

    rerender({ station: '1b' });
    expect(result.current.snap).toBe('half');

    rerender({ station: undefined });
    expect(result.current.snap).toBe('hidden');
  });

  it('keeps the detail hidden when another station opens', () => {
    const { result, rerender } = renderSheetSnap('1a');
    act(() => result.current.setSnap('hidden'));

    rerender({ station: '1b' });

    expect(result.current.snap).toBe('hidden');
  });

  it('goes back to the list at half after a station link', () => {
    const { result, rerender } = renderSheetSnap('1a');
    act(() => result.current.setSnap('hidden'));

    rerender({ station: undefined });

    expect(result.current.snap).toBe('half');
  });
});
