export const TONES = [
  'success',
  'warning',
  'danger',
  'neutral',
  'muted',
  'info',
  'inverse',
] as const;

export type Tone = (typeof TONES)[number];

export type LineStyle = 'solid' | 'dashed';

// A border style is not a color, so it lives here and not in the tokens. Danger is dashed so
// that an empty value does not rely on color alone.
export const toneLineStyle = {
  success: 'solid',
  warning: 'solid',
  danger: 'dashed',
  neutral: 'solid',
  muted: 'solid',
  info: 'solid',
  inverse: 'solid',
} as const satisfies Record<Tone, LineStyle>;
