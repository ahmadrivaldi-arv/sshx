import type { CommandSnippet } from '../../types/snippet.js';
import { fuzzyScore } from '../palette/command-palette.js';

export interface SnippetPickerAction {
  close?: boolean;
  command?: string;
  execute?: boolean;
}

type PickerStage = 'search' | 'variables' | 'preview';

const variablePattern = /{{\s*([A-Za-z][A-Za-z0-9_-]*)\s*}}/g;

export const getSnippetVariables = (command: string): string[] => {
  const variables: string[] = [];
  for (const match of command.matchAll(variablePattern)) {
    const name = match[1];
    if (name && !variables.includes(name)) variables.push(name);
  }
  return variables;
};

const safePreview = (value: string): string =>
  [...value]
    .map((character) => {
      const code = character.charCodeAt(0);
      if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
        return `\\x${code.toString(16).padStart(2, '0')}`;
      }
      return character;
    })
    .join('');

export class SessionSnippetPicker {
  private query = '';
  private selectedIndex = 0;
  private stage: PickerStage = 'search';
  private selected?: CommandSnippet;
  private variables: string[] = [];
  private variableIndex = 0;
  private variableInput = '';
  private readonly values = new Map<string, string>();

  public constructor(private readonly snippets: CommandSnippet[]) {}

  public handleInput(input: string): SnippetPickerAction {
    if (input === '\x1b' || input === '\x03') return { close: true };

    if (this.stage === 'preview') {
      const key = input.toLowerCase();
      if (key === 'i') return { close: true, command: this.renderCommand(), execute: false };
      if (key === 'x' || input === '\r' || input === '\n') {
        return { close: true, command: this.renderCommand(), execute: true };
      }
      return {};
    }

    if (input === '\x1b[A') {
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      return {};
    }
    if (input === '\x1b[B') {
      this.selectedIndex = Math.min(this.selectedIndex + 1, Math.max(this.matches().length - 1, 0));
      return {};
    }

    if (input === '\r' || input === '\n') {
      if (this.stage === 'search') {
        const selected = this.matches()[this.selectedIndex];
        if (!selected) return {};
        this.selected = selected;
        this.variables = getSnippetVariables(selected.command);
        if (this.variables.length === 0) {
          this.stage = 'preview';
        } else {
          this.stage = 'variables';
          this.selectedIndex = 0;
        }
      } else {
        const variable = this.variables[this.variableIndex];
        if (variable) this.values.set(variable, this.variableInput);
        this.variableInput = '';
        if (this.variableIndex < this.variables.length - 1) {
          this.variableIndex += 1;
        } else {
          this.stage = 'preview';
        }
      }
      return {};
    }

    if (input === '\u007f' || input === '\b') {
      if (this.stage === 'search') {
        this.query = this.query.slice(0, -1);
        this.selectedIndex = 0;
      } else {
        this.variableInput = this.variableInput.slice(0, -1);
      }
      return {};
    }

    const printable = [...input].filter((character) => character >= ' ' && character !== '\u007f');
    if (printable.length > 0) {
      if (this.stage === 'search') {
        this.query += printable.join('');
        this.selectedIndex = 0;
      } else {
        this.variableInput += printable.join('');
      }
    }
    return {};
  }

  public render(columns = 80): string {
    const width = Math.max(Math.min(columns - 4, 100), 30);
    const line = '─'.repeat(width);
    const lines = ['sshx snippets', line];

    if (this.stage === 'search') {
      lines.push(`Search: ${safePreview(this.query)}_`, '');
      const matches = this.matches().slice(0, 8);
      if (matches.length === 0) {
        lines.push('  No matching snippets');
      } else {
        matches.forEach((snippet, index) => {
          lines.push(`${index === this.selectedIndex ? '›' : ' '} ${snippet.name}`);
          if (index === this.selectedIndex) {
            lines.push(`    ${safePreview(snippet.command).slice(0, width - 4)}`);
          }
        });
      }
      lines.push('', '↑/↓ select  Enter preview  Esc cancel');
    } else if (this.stage === 'variables') {
      const variable = this.variables[this.variableIndex] ?? '';
      lines.push(`Snippet: ${this.selected?.name ?? ''}`, '');
      lines.push(`Value for {{${variable}}}: ${safePreview(this.variableInput)}_`);
      lines.push(
        '',
        `${this.variableIndex + 1}/${this.variables.length}  Enter continue  Esc cancel`
      );
    } else {
      lines.push(`Snippet: ${this.selected?.name ?? ''}`, '', 'Preview:');
      lines.push(safePreview(this.renderCommand()));
      lines.push('', 'I insert  X/Enter insert & execute  Esc cancel');
    }

    return `\x1B[2J\x1B[H${lines.join('\r\n')}`;
  }

  private matches(): CommandSnippet[] {
    if (!this.query.trim()) {
      return [...this.snippets].sort((left, right) => left.name.localeCompare(right.name));
    }
    return this.snippets
      .map((snippet) => ({
        snippet,
        score: fuzzyScore(
          this.query,
          `${snippet.name} ${snippet.description ?? ''} ${snippet.tags.join(' ')} ${snippet.command}`
        )
      }))
      .filter(
        (entry): entry is { snippet: CommandSnippet; score: number } => entry.score !== undefined
      )
      .sort((left, right) => right.score - left.score)
      .map(({ snippet }) => snippet);
  }

  private renderCommand(): string {
    const command = this.selected?.command ?? '';
    return command.replace(variablePattern, (_match, name: string) => this.values.get(name) ?? '');
  }
}
