import { LINE_STYLE_CLASSES, TONES, toneLineStyle } from '.';

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

describe('LINE_STYLE_CLASSES', () => {
  it.each([
    ['solid', 'border-solid'],
    ['dashed', 'border-dashed'],
  ] as const)('draws a %s line with %s', (lineStyle, className) => {
    expect(LINE_STYLE_CLASSES[lineStyle]).toBe(className);
  });
});
