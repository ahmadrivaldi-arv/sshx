import { describe, expect, it } from 'vitest';
import { customThemeFileToDefinition, parseCustomThemeFile } from './theme-file.js';

describe('custom theme files', () => {
  it('applies optional file defaults and creates a runtime definition', () => {
    const file = parseCustomThemeFile({
      name: 'forest-night',
      label: 'Forest Night',
      description: 'Green custom palette',
      colors: {
        accent: '#22c55e',
        muted: '#526657',
        border: '#314638',
        text: '#ecfdf5',
        favorite: '#fde047',
        warning: '#fb923c',
        danger: '#ef4444'
      }
    });

    expect(file.decorated).toBe(true);
    expect(file.useConnectionColors).toBe(false);
    expect(customThemeFileToDefinition(file)).toMatchObject({
      name: 'forest-night',
      accent: '#22c55e',
      source: 'custom'
    });
  });

  it('rejects unsafe names and incomplete palettes', () => {
    expect(() =>
      parseCustomThemeFile({
        name: '../escape',
        label: 'Unsafe',
        description: 'Unsafe path',
        colors: {}
      })
    ).toThrow('Theme name must contain');
  });
});
