import type { CommandSnippet } from '../../types/snippet.js';
import { fuzzyScore } from '../palette/command-palette.js';

export interface SnippetPickerAction {
  close?: boolean;
  command?: string;
  execute?: boolean;
}

type PickerStage = 'search' | 'variables' | 'preview';

const variablePattern = /{{\s*([A-Za-z][A-Za-z0-9_-]*)\s*}}/g;

const ansi = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  white: '\x1B[39m',
  gray: '\x1B[2m',
  cyan: '\x1B[36m',
  magenta: '\x1B[35m',
  yellow: '\x1B[33m',
  green: '\x1B[32m',
  selected: '\x1B[7m'
} as const;

const paint = (value: string, color: string): string => `${color}${value}${ansi.reset}`;

const ansiSgrPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const ansiTokenPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m|.`, 'gu');

const stripAnsi = (value: string): string => value.replace(ansiSgrPattern, '');

const fit = (value: string, width: number): string => {
  const characters = [...value];
  if (characters.length <= width) return value;
  if (width <= 1) return characters.slice(0, width).join('');
  return `${characters.slice(0, width - 1).join('')}…`;
};

const fitAnsi = (value: string, width: number): string => {
  if ([...stripAnsi(value)].length <= width) return value;

  const tokens = value.match(ansiTokenPattern) ?? [];
  const target = Math.max(width - 1, 0);
  let visible = 0;
  let result = '';
  for (const token of tokens) {
    if (token.startsWith('\x1B[')) {
      result += token;
    } else if (visible < target) {
      result += token;
      visible += 1;
    } else {
      break;
    }
  }
  return `${result}${width > 0 ? '…' : ''}${ansi.reset}`;
};

const padAnsi = (value: string, width: number): string => {
  const length = [...stripAnsi(value)].length;
  return `${value}${' '.repeat(Math.max(width - length, 0))}`;
};

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
      if (code < 32 || code === 127) {
        if (character === '\t') return '\\t';
        if (character === '\n') return '\\n';
        if (character === '\r') return '\\r';
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
    const width = Math.max(Math.min(columns - 2, 100), 30);
    const innerWidth = width - 2;
    const border = (left: string, fill: string, right: string): string =>
      paint(`${left}${fill.repeat(innerWidth)}${right}`, ansi.gray);
    const row = (content = '', background?: string): string => {
      const padded = padAnsi(fitAnsi(content, innerWidth), innerWidth);
      const body = background ? `${background}${padded}${ansi.reset}` : padded;
      return `${paint('│', ansi.gray)}${body}${paint('│', ansi.gray)}`;
    };
    const divider = (): string => border('├', '─', '┤');
    const title = `${paint(' sshx ', `${ansi.bold}${ansi.magenta}`)} ${paint(
      'SNIPPET PICKER',
      `${ansi.bold}${ansi.cyan}`
    )}`;
    const lines = [border('╭', '─', '╮'), row(title), divider()];

    if (this.stage === 'search') {
      const matches = this.matches();
      const visibleCount = 7;
      const windowStart = Math.max(
        0,
        Math.min(this.selectedIndex - Math.floor(visibleCount / 2), matches.length - visibleCount)
      );
      const visibleMatches = matches.slice(windowStart, windowStart + visibleCount);
      const query = this.query
        ? `${paint(fit(safePreview(this.query), innerWidth - 13), ansi.white)}${paint(
            '▏',
            ansi.cyan
          )}`
        : paint('Type to filter snippets…', ansi.gray);
      lines.push(row(` ${paint('⌕  SEARCH', `${ansi.bold}${ansi.yellow}`)}  ${query}`), divider());

      if (matches.length === 0) {
        lines.push(
          row(''),
          row(` ${paint('No matching snippets', `${ansi.bold}${ansi.yellow}`)}`),
          row(` ${paint('Try another name, tag, or command.', ansi.gray)}`),
          row('')
        );
      } else {
        visibleMatches.forEach((snippet, visibleIndex) => {
          const index = windowStart + visibleIndex;
          const selected = index === this.selectedIndex;
          const prefix = selected ? ' ❯ ' : '   ';
          const position = `${String(index + 1).padStart(2, '0')} `;
          const available = innerWidth - prefix.length - position.length - 1;
          const name = fit(safePreview(snippet.name), available);
          const content = `${prefix}${position}${name}`;
          lines.push(
            selected
              ? row(padAnsi(content, innerWidth), ansi.selected)
              : row(
                  `${paint(prefix, ansi.gray)}${paint(position, ansi.gray)}${paint(name, ansi.white)}`
                )
          );
        });
      }

      const selected = matches[this.selectedIndex];
      if (selected) {
        lines.push(divider());
        const commandWidth = Math.max(innerWidth - 12, 1);
        lines.push(
          row(
            ` ${paint('SELECTED', `${ansi.bold}${ansi.magenta}`)}  ${paint(
              fit(safePreview(selected.name), commandWidth),
              `${ansi.bold}${ansi.white}`
            )}`
          ),
          row(
            ` ${paint('Command', ansi.yellow)}   ${paint(
              fit(safePreview(selected.command), commandWidth),
              ansi.green
            )}`
          )
        );
        if (selected.description) {
          lines.push(
            row(
              ` ${paint('About', ansi.magenta)}     ${paint(
                fit(safePreview(selected.description), commandWidth),
                ansi.white
              )}`
            )
          );
        }
        if (selected.tags.length > 0) {
          lines.push(
            row(
              ` ${paint('Tags', ansi.cyan)}      ${paint(
                fit(selected.tags.map((tag) => `#${safePreview(tag)}`).join('  '), commandWidth),
                ansi.cyan
              )}`
            )
          );
        }
      }
      lines.push(
        divider(),
        row(
          ` ${paint('↑↓', ansi.yellow)} ${paint('navigate', ansi.gray)}   ${paint(
            'Enter',
            ansi.green
          )} ${paint('preview', ansi.gray)}   ${paint('Esc', ansi.magenta)} ${paint(
            'cancel',
            ansi.gray
          )}`
        )
      );
    } else if (this.stage === 'variables') {
      const variable = this.variables[this.variableIndex] ?? '';
      lines.push(
        row(
          ` ${paint('VARIABLES', `${ansi.bold}${ansi.magenta}`)}  ${paint(
            safePreview(this.selected?.name ?? ''),
            `${ansi.bold}${ansi.white}`
          )}`
        ),
        divider(),
        row(''),
        row(
          ` ${paint(`Value for {{${variable}}}`, `${ansi.bold}${ansi.yellow}`)} ${paint(
            `${fit(safePreview(this.variableInput), Math.max(innerWidth - variable.length - 20, 1))}▏`,
            ansi.white
          )}`
        ),
        row(''),
        row(
          ` ${paint(
            `${this.variableIndex + 1}/${this.variables.length}`,
            `${ansi.bold}${ansi.cyan}`
          )} ${paint('variables', ansi.gray)}`
        ),
        divider(),
        row(
          ` ${paint('Enter', ansi.green)} ${paint('continue', ansi.gray)}   ${paint(
            'Esc',
            ansi.magenta
          )} ${paint('cancel', ansi.gray)}`
        )
      );
    } else {
      lines.push(
        row(
          ` ${paint('READY TO USE', `${ansi.bold}${ansi.green}`)}  ${paint(
            safePreview(this.selected?.name ?? ''),
            `${ansi.bold}${ansi.white}`
          )}`
        ),
        divider(),
        row(` ${paint('COMMAND PREVIEW', `${ansi.bold}${ansi.yellow}`)}`),
        row(''),
        row(` ${paint(fit(safePreview(this.renderCommand()), innerWidth - 2), ansi.green)}`),
        row(''),
        divider(),
        row(
          ` ${paint('I', ansi.cyan)} ${paint('insert only', ansi.gray)}   ${paint(
            'X / Enter',
            ansi.green
          )} ${paint('insert & run', ansi.gray)}   ${paint('Esc', ansi.magenta)} ${paint(
            'cancel',
            ansi.gray
          )}`
        )
      );
    }

    lines.push(border('╰', '─', '╯'));
    return `\x1B[?25l\x1B[2J\x1B[H${lines.join('\r\n')}${ansi.reset}`;
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
