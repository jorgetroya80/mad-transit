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

  it.each(['peek', 'half', 'full'] as const)('opens a station at half from %s', (listSnap) => {
    const { result, rerender } = renderSheetSnap();
    act(() => result.current.setSnap(listSnap));

    rerender({ station: '1a' });

    expect(result.current.snap).toBe('half');
  });

  it('cycles the detail half ↔ peek, never full', () => {
    const { result } = renderSheetSnap('1a');

    expect(result.current.nextSnap).toEqual({ peek: 'half', half: 'peek', full: 'half' });
  });

  it.each([
    ['peek', 'Ampliar detalle'],
    ['half', 'Reducir detalle'],
  ] as const)('names the detail handle at %s "%s"', (snap, handleLabel) => {
    const { result } = renderSheetSnap('1a');

    act(() => result.current.setSnap(snap));

    expect(result.current.handleLabel).toBe(handleLabel);
  });

  it.each(['peek', 'half', 'full'] as const)(
    'goes back to the list at %s when the station gets closed',
    (listSnap) => {
      const { result, rerender } = renderSheetSnap();
      act(() => result.current.setSnap(listSnap));
      rerender({ station: '1a' });
      act(() => result.current.setSnap('peek'));

      rerender({ station: undefined });

      expect(result.current.snap).toBe(listSnap);
      expect(result.current.nextSnap).toEqual({ peek: 'half', half: 'full', full: 'half' });
    },
  );

  it('keeps the height and the remembered list height when another station opens', () => {
    const { result, rerender } = renderSheetSnap();
    act(() => result.current.setSnap('full'));
    rerender({ station: '1a' });
    act(() => result.current.setSnap('peek'));

    rerender({ station: '1b' });
    expect(result.current.snap).toBe('peek');

    rerender({ station: undefined });
    expect(result.current.snap).toBe('full');
  });

  it('goes back to the list at half after a station link', () => {
    const { result, rerender } = renderSheetSnap('1a');
    act(() => result.current.setSnap('peek'));

    rerender({ station: undefined });

    expect(result.current.snap).toBe('half');
  });
});
