import { describe, expect, it } from 'vitest';
import type { CommandSnippet } from '../../types/snippet.js';
import { getSnippetVariables, SessionSnippetPicker } from './session-snippet-picker.js';

const snippet: CommandSnippet = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Docker logs',
  command: 'docker logs -f {{container}}',
  description: 'Follow logs',
  tags: ['docker'],
  createdAt: '2026-07-27T00:00:00.000Z',
  updatedAt: '2026-07-27T00:00:00.000Z'
};

describe('SessionSnippetPicker', () => {
  it('collects placeholders and inserts without executing by default', () => {
    const picker = new SessionSnippetPicker([snippet]);
    picker.handleInput('dock');
    picker.handleInput('\r');
    expect(picker.render()).toContain('Value for {{container}}');
    picker.handleInput('api');
    picker.handleInput('\r');
    expect(picker.render()).toContain('docker logs -f api');
    expect(picker.handleInput('i')).toEqual({
      close: true,
      command: 'docker logs -f api',
      execute: false
    });
  });

  it('can insert and execute after preview', () => {
    const picker = new SessionSnippetPicker([{ ...snippet, command: 'uptime' }]);
    picker.handleInput('\r');
    expect(picker.handleInput('\r')).toEqual({
      close: true,
      command: 'uptime',
      execute: true
    });
  });

  it('deduplicates placeholder names', () => {
    expect(getSnippetVariables('echo {{host}} {{ host }} {{port}}')).toEqual(['host', 'port']);
  });
});
