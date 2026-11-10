import { TONES, toneLineStyle } from '.';

describe('toneLineStyle', () => {
  it('draws danger with a dashed line, the only tone whose color is not the cue', () => {
    expect(toneLineStyle.danger).toBe('dashed');
  });

  it.each(TONES.filter((tone) => tone !== 'danger'))('draws %s with a solid line', (tone) => {
    expect(toneLineStyle[tone]).toBe('solid');
  });

  it('covers the seven tones', () => {
    expect(TONES).toEqual(['success', 'warning', 'danger', 'neutral', 'muted', 'info', 'inverse']);
  });
});
