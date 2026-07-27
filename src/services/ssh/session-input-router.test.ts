import { describe, expect, it } from 'vitest';
import { normalizeNativeTerminalInput, routeSessionInput } from './session-input-router.js';

describe('native session input', () => {
  it('normalizes a terminal LF Enter to CR', () => {
    expect(normalizeNativeTerminalInput('\n')).toBe('\r');
    expect(normalizeNativeTerminalInput('\r')).toBe('\r');
  });

  it('opens snippets after Ctrl+G or Ctrl+B then S without forwarding the prefix', () => {
    expect(routeSessionInput('\x07S', undefined, ['ctrl-g-s'])).toEqual({
      remoteData: '',
      pendingPrefix: undefined,
      openSnippets: true,
      remainder: ''
    });
    expect(routeSessionInput('s', '\x02')).toEqual({
      remoteData: '',
      pendingPrefix: undefined,
      openSnippets: true,
      remainder: ''
    });
  });

  it('opens snippets for common F2 terminal sequences', () => {
    for (const sequence of ['\x1bOQ', '\x1b[12~', '\x1b[[B']) {
      expect(routeSessionInput(sequence)).toMatchObject({
        remoteData: '',
        pendingPrefix: undefined,
        openSnippets: true
      });
    }
  });

  it('forwards unknown prefix combinations unchanged', () => {
    expect(routeSessionInput('x', '\x02')).toEqual({
      remoteData: '\x02x',
      pendingPrefix: undefined,
      openSnippets: false,
      remainder: ''
    });
  });

  it('does not consume shortcuts that are not configured', () => {
    expect(routeSessionInput('\x1bOQ', undefined, ['ctrl-b-s']).remoteData).toBe('\x1bOQ');
    expect(routeSessionInput('\x07s', undefined, ['f2']).remoteData).toBe('\x07s');
  });
});
