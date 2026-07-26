import { describe, expect, it } from 'vitest';
import { fuzzyScore, matchPaletteCommands, parsePaletteInput } from './command-palette.js';

describe('command palette', () => {
  it('fuzzy matches command names', () => {
    expect(fuzzyScore('dlt', 'delete')).toBeTypeOf('number');
    expect(fuzzyScore('xyz', 'delete')).toBeUndefined();
    expect(matchPaletteCommands('th')[0]?.name).toBe('theme');
  });

  it('parses commands and arguments', () => {
    expect(parsePaletteInput('import hosts.json --apply')).toEqual({
      command: 'import',
      args: ['hosts.json', '--apply']
    });
    expect(parsePaletteInput('unknown')).toEqual({ args: [] });
  });
});
