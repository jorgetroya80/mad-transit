import { readMapPointStyle } from './mapPointStyle';

const tokens = {
  '--color-tone-success': '#0b6b3a',
  '--color-tone-success-foreground': '#ffffff',
  '--color-tone-warning': '#f2b33d',
  '--color-tone-warning-foreground': '#2a1e00',
  '--color-tone-danger': '#ffffff',
  '--color-tone-danger-foreground': '#b42318',
  '--color-tone-danger-line': '#b42318',
  '--color-tone-neutral': '#4b5563',
  '--color-tone-neutral-foreground': '#ffffff',
  '--color-tone-muted': '#e3e6ea',
  '--color-tone-muted-foreground': '#2b333e',
  '--color-tone-muted-line': '#8a95a3',
  '--color-tone-info': '#0b5cad',
  '--color-tone-info-foreground': '#ffffff',
  '--color-tag': '#2b333e',
  '--color-map-point-stroke': '#fffffe',
  '--color-map-point-selected-stroke': '#0b5cae',
  '--font-sans': "'Inter Variable', sans-serif",
};

describe('readMapPointStyle', () => {
  afterEach(() => {
    for (const token of Object.keys(tokens)) document.documentElement.style.removeProperty(token);
  });

  it('reads the tone, tag, halo and ring colors and the app font from the theme tokens', () => {
    for (const [token, value] of Object.entries(tokens)) {
      document.documentElement.style.setProperty(token, value);
    }

    expect(readMapPointStyle()).toEqual({
      colors: {
        tones: {
          success: { fill: '#0b6b3a', text: '#ffffff' },
          warning: { fill: '#f2b33d', text: '#2a1e00' },
          danger: { fill: '#ffffff', text: '#b42318' },
          neutral: { fill: '#4b5563', text: '#ffffff' },
          muted: { fill: '#e3e6ea', text: '#2b333e' },
          info: { fill: '#0b5cad', text: '#ffffff' },
        },
        lines: { danger: '#b42318', muted: '#8a95a3' },
        tag: '#2b333e',
        halo: '#fffffe',
        selectedRing: '#0b5cae',
      },
      fontFamily: "'Inter Variable', sans-serif",
    });
  });

  it('falls back to a generic font when the theme has none', () => {
    expect(readMapPointStyle().fontFamily).toBe('sans-serif');
  });
});
