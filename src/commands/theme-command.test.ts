import { describe, expect, it } from 'vitest';
import { resolveTheme } from '../themes/themes.js';
import { renderThemePreview } from './theme-command.js';

describe('renderThemePreview', () => {
  it('renders theme identity and preferences', () => {
    const output = renderThemePreview(
      resolveTheme({
        name: 'tokyo-night',
        compact: true,
        ascii: false
      })
    );

    expect(output).toContain('Tokyo Night');
    expect(output).toContain('compact: on');
    expect(output).toContain('charset: unicode');
    expect(output).toContain('#7aa2f7');
  });

  it('renders an ASCII-safe preview', () => {
    const output = renderThemePreview(
      resolveTheme({
        name: 'mono',
        compact: false,
        ascii: true
      })
    );

    expect(output).toContain('+----------------------+');
    expect(output).toContain('charset: ascii');
    expect(output).not.toMatch(/[✦❯★▊↑↓•⏎⚠—⚡…┌┐└┘─]/);
  });
});
