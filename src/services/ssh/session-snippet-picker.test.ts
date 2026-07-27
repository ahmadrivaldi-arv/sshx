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

  it('renders a colorful, unambiguous selected row and detail panel', () => {
    const picker = new SessionSnippetPicker([
      snippet,
      { ...snippet, id: '00000000-0000-4000-8000-000000000011', name: 'System uptime' }
    ]);
    const firstRender = picker.render();

    expect(firstRender).toContain('\x1B[7m');
    expect(firstRender).not.toContain('[38;5;');
    expect(firstRender).not.toContain('[48;5;');
    expect(firstRender).toContain('SELECTED');
    expect(firstRender).toContain('Docker logs');
    expect(firstRender).toContain('Follow logs');
    expect(firstRender).toContain('#docker');

    picker.handleInput('\x1b[B');
    expect(picker.render()).toContain('System uptime');
  });

  it('keeps the colorful picker inside a narrow terminal', () => {
    const picker = new SessionSnippetPicker([snippet]);
    const rendered = picker.render(32);
    const controlSequence = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[A-Za-z]`, 'g');
    const visibleLines = rendered.replace(controlSequence, '').split('\r\n');

    expect(visibleLines.every((line) => [...line].length <= 30)).toBe(true);
  });
});
