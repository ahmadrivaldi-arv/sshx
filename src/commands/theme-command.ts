import chalk from 'chalk';
import type { Command } from 'commander';
import type { ThemeService } from '../services/config/theme-service.js';
import { getThemeGlyphs, resolveTheme } from '../themes/themes.js';
import type { ResolvedTheme, ThemeConfigPatch, ThemeName } from '../types/theme.js';

interface ThemeSetOptions {
  accent?: string;
  clearAccent?: boolean;
  compact?: boolean;
  expanded?: boolean;
  ascii?: boolean;
  unicode?: boolean;
}

interface ThemeInstallOptions {
  force?: boolean;
}

const parseThemeName = (value: string): ThemeName => {
  if (/^[a-z0-9][a-z0-9-]{0,63}$/.test(value)) {
    return value;
  }

  throw new Error('Theme name must contain lowercase letters, numbers, and hyphens');
};

const colorize = (color: string | undefined, value: string): string => {
  if (!color) return value;
  if (color.startsWith('#')) return chalk.hex(color)(value);
  if (color === 'gray') return chalk.gray(value);
  if (color === 'yellow') return chalk.yellow(value);
  if (color === 'red') return chalk.red(value);

  return chalk.white(value);
};

export const renderThemePreview = (theme: ResolvedTheme): string => {
  const glyphs = getThemeGlyphs(theme.ascii);
  const border = theme.decorated
    ? theme.ascii
      ? '+----------------------+'
      : '┌──────────────────────┐'
    : '';
  const borderBottom = theme.decorated
    ? theme.ascii
      ? '+----------------------+'
      : '└──────────────────────┘'
    : '';
  const lines = [
    colorize(theme.accent, theme.decorated ? `${glyphs.brand} ${theme.label}` : theme.label),
    colorize(theme.muted, theme.description),
    border ? colorize(theme.border, border) : '',
    `${colorize(theme.favorite, glyphs.favorite)} Favorites`,
    colorize(theme.accent, `${glyphs.cursor} Production`),
    `  ${colorize(theme.text, 'Staging')}`,
    colorize(theme.muted, `  deploy@example.com ${glyphs.separator} port 22`),
    colorize(theme.warning, `${glyphs.warning} Warning message`),
    colorize(theme.danger, `! Error message`),
    borderBottom ? colorize(theme.border, borderBottom) : '',
    colorize(
      theme.muted,
      `compact: ${theme.compact ? 'on' : 'off'} ${glyphs.separator} charset: ${
        theme.ascii ? 'ascii' : 'unicode'
      } ${glyphs.separator} accent: ${theme.accent ?? 'terminal'}`
    )
  ];

  return `${lines.filter(Boolean).join('\n')}\n`;
};

export const registerThemeCommand = (program: Command, service: ThemeService): void => {
  const themeCommand = program.command('theme').description('Manage TUI themes');

  themeCommand
    .command('list')
    .description('List built-in and installed themes')
    .action(async (): Promise<void> => {
      const current = await service.getConfig();

      for (const theme of await service.list()) {
        const marker = theme.name === current.name ? '*' : ' ';
        process.stdout.write(
          `${marker} ${theme.name.padEnd(16)} ${theme.source.padEnd(8)} ${theme.accent.padEnd(
            9
          )} ${theme.description}\n`
        );
      }

      if (current.accentColor) {
        process.stdout.write(`\nCustom accent: ${current.accentColor}\n`);
      }

      process.stdout.write(
        `Compact: ${current.compact ? 'on' : 'off'}  ASCII: ${current.ascii ? 'on' : 'off'}\n`
      );
    });

  themeCommand
    .command('set')
    .description('Set the active theme and display preferences')
    .argument('<name>', 'Built-in theme name')
    .option('--accent <color>', 'Override the theme accent color using #RRGGBB')
    .option('--clear-accent', 'Use the built-in theme accent')
    .option('--compact', 'Always use compact layout')
    .option('--expanded', 'Use expanded layout when the terminal is large enough')
    .option('--ascii', 'Use ASCII-compatible symbols and borders')
    .option('--unicode', 'Use Unicode symbols and borders')
    .action(async (nameValue: string, options: ThemeSetOptions): Promise<void> => {
      const name = parseThemeName(nameValue);
      await service.getDefinition(name);

      if (options.accent && options.clearAccent) {
        throw new Error('Use either --accent or --clear-accent, not both');
      }

      if (options.compact && options.expanded) {
        throw new Error('Use either --compact or --expanded, not both');
      }

      if (options.ascii && options.unicode) {
        throw new Error('Use either --ascii or --unicode, not both');
      }

      if (options.accent && !/^#[0-9a-fA-F]{6}$/.test(options.accent)) {
        throw new Error('Accent color must use #RRGGBB format');
      }

      const patch: ThemeConfigPatch = {
        name,
        ...(options.clearAccent
          ? { accentColor: null }
          : options.accent
            ? { accentColor: options.accent }
            : {}),
        ...(options.compact ? { compact: true } : options.expanded ? { compact: false } : {}),
        ...(options.ascii ? { ascii: true } : options.unicode ? { ascii: false } : {})
      };
      const theme = await service.update(patch);

      process.stdout.write(
        `Theme set to ${theme.name} (accent ${theme.accent ?? 'terminal'}, compact ${
          theme.compact ? 'on' : 'off'
        }, ASCII ${theme.ascii ? 'on' : 'off'})\n`
      );
    });

  themeCommand
    .command('preview')
    .description('Preview a theme without changing configuration')
    .argument('<name>', 'Built-in theme name')
    .action(async (nameValue: string): Promise<void> => {
      const name = parseThemeName(nameValue);
      const current = await service.getConfig();
      const preview = resolveTheme({ ...current, name }, await service.getDefinition(name));

      process.stdout.write(renderThemePreview(preview));
    });

  themeCommand
    .command('install')
    .description('Install a custom theme from a local JSON file')
    .argument('<file>', 'Path to a custom theme JSON file')
    .option('--force', 'Replace an installed theme with the same name')
    .action(async (file: string, options: ThemeInstallOptions): Promise<void> => {
      const theme = await service.install(file, { force: options.force ?? false });
      process.stdout.write(`Installed theme ${theme.name} in ${service.getThemesDir()}\n`);
    });

  themeCommand
    .command('path')
    .description('Show the custom theme directory')
    .action(async (): Promise<void> => {
      process.stdout.write(`${await service.ensureThemesDir()}\n`);
    });

  themeCommand.action(async (): Promise<void> => {
    const theme = await service.getResolved();
    process.stdout.write(renderThemePreview(theme));
  });
};
