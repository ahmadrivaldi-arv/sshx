import { describe, expect, it } from 'vitest';
import { themeNames } from '../types/theme.js';
import { builtInThemes, getThemeGlyphs, getThemeDefinition, resolveTheme } from './themes.js';

describe('themes', () => {
  it('provides every documented built-in theme', () => {
    expect(builtInThemes.map((theme) => theme.name)).toEqual(themeNames);

    for (const name of themeNames) {
      expect(getThemeDefinition(name).accent).toBeTruthy();
    }
  });

  it('resolves a custom accent without changing the built-in definition', () => {
    const resolved = resolveTheme({
      name: 'dracula',
      accentColor: '#123456',
      compact: true,
      ascii: true
    });

    expect(resolved.accent).toBe('#123456');
    expect(resolved.configuredAccent).toBe('#123456');
    expect(resolved.compact).toBe(true);
    expect(resolved.ascii).toBe(true);
    expect(getThemeDefinition('dracula').accent).toBe('#bd93f9');
  });

  it('uses terminal-safe glyphs in ASCII mode', () => {
    expect(getThemeGlyphs(true)).toMatchObject({
      brand: '*',
      cursor: '>',
      favorite: '*',
      up: '^',
      down: 'v',
      separator: '|',
      empty: '-',
      ellipsis: '...'
    });
    expect(getThemeGlyphs(false).brand).toBe('✦');
  });
});
