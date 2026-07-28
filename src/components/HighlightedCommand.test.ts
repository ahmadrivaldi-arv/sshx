import { describe, expect, it } from 'vitest';
import { splitCommandPlaceholders } from './HighlightedCommand.js';

describe('splitCommandPlaceholders', () => {
  it('marks editable snippet placeholders', () => {
    expect(splitCommandPlaceholders('ssh {{user}}@{{host}} -p 22')).toEqual([
      { text: 'ssh ', placeholder: false },
      { text: '{{user}}', placeholder: true },
      { text: '@', placeholder: false },
      { text: '{{host}}', placeholder: true },
      { text: ' -p 22', placeholder: false }
    ]);
  });
});
