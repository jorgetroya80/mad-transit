import { readMapColors } from './mapColors';

const tokens = {
  '--color-map-user-location': '#2563eb',
  '--color-map-point-stroke': '#ffffff',
};

describe('readMapColors', () => {
  afterEach(() => {
    for (const token of Object.keys(tokens)) document.documentElement.style.removeProperty(token);
  });

  it('reads the user location colors from the theme tokens', () => {
    for (const [token, value] of Object.entries(tokens)) {
      document.documentElement.style.setProperty(token, value);
    }

    expect(readMapColors()).toEqual({ userLocation: '#2563eb', pointStroke: '#ffffff' });
  });
});
