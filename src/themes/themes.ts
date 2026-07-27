import type {
  BuiltInThemeName,
  ResolvedTheme,
  ThemeConfig,
  ThemeDefinition,
  ThemeName
} from '../types/theme.js';

export const builtInThemes: readonly ThemeDefinition[] = [
  {
    name: 'default',
    label: 'Default',
    description: 'Adaptive terminal colors with the sshx orange accent',
    accent: '#f97316',
    muted: 'terminal',
    border: 'terminal',
    text: 'terminal',
    favorite: 'yellow',
    warning: 'yellow',
    danger: 'red',
    decorated: true,
    useConnectionColors: true,
    source: 'built-in'
  },
  {
    name: 'minimal',
    label: 'Minimal',
    description: 'Adaptive terminal colors with reduced decoration',
    accent: 'terminal',
    muted: 'terminal',
    border: 'terminal',
    text: 'terminal',
    favorite: 'terminal',
    warning: 'yellow',
    danger: 'red',
    decorated: false,
    useConnectionColors: false,
    source: 'built-in'
  },
  {
    name: 'mono',
    label: 'Mono',
    description: 'Adaptive monochrome palette for light, dark, and limited-color terminals',
    accent: 'terminal',
    muted: 'terminal',
    border: 'terminal',
    text: 'terminal',
    favorite: 'terminal',
    warning: 'terminal',
    danger: 'terminal',
    decorated: true,
    useConnectionColors: false,
    source: 'built-in'
  },
  {
    name: 'dracula',
    label: 'Dracula',
    description: 'Purple and pink on the classic Dracula palette',
    accent: '#bd93f9',
    muted: '#6272a4',
    border: '#44475a',
    text: '#f8f8f2',
    favorite: '#f1fa8c',
    warning: '#ffb86c',
    danger: '#ff5555',
    decorated: true,
    useConnectionColors: false,
    source: 'built-in'
  },
  {
    name: 'nord',
    label: 'Nord',
    description: 'Cool arctic blues with soft contrast',
    accent: '#88c0d0',
    muted: '#4c566a',
    border: '#4c566a',
    text: '#eceff4',
    favorite: '#ebcb8b',
    warning: '#d08770',
    danger: '#bf616a',
    decorated: true,
    useConnectionColors: false,
    source: 'built-in'
  },
  {
    name: 'catppuccin',
    label: 'Catppuccin',
    description: 'Warm Catppuccin Mocha pastels',
    accent: '#cba6f7',
    muted: '#6c7086',
    border: '#45475a',
    text: '#cdd6f4',
    favorite: '#f9e2af',
    warning: '#fab387',
    danger: '#f38ba8',
    decorated: true,
    useConnectionColors: false,
    source: 'built-in'
  },
  {
    name: 'tokyo-night',
    label: 'Tokyo Night',
    description: 'Deep blue with vivid night-city accents',
    accent: '#7aa2f7',
    muted: '#565f89',
    border: '#3b4261',
    text: '#c0caf5',
    favorite: '#e0af68',
    warning: '#ff9e64',
    danger: '#f7768e',
    decorated: true,
    useConnectionColors: false,
    source: 'built-in'
  }
];

const themesByName = new Map<BuiltInThemeName, ThemeDefinition>(
  builtInThemes.map((theme) => [theme.name as BuiltInThemeName, theme])
);

export const getThemeDefinition = (name: ThemeName): ThemeDefinition => {
  const theme = themesByName.get(name as BuiltInThemeName);

  if (!theme) {
    throw new Error(`Unknown theme "${name}"`);
  }

  return theme;
};

export const resolveTheme = (
  config: ThemeConfig,
  themeDefinition?: ThemeDefinition
): ResolvedTheme => {
  const definition = themeDefinition ?? getThemeDefinition(config.name);
  const resolveColor = (color: string): string => (color === 'terminal' ? '' : color);
  const accent = config.accentColor ?? definition.accent;

  return {
    ...definition,
    accent: resolveColor(accent),
    muted: resolveColor(definition.muted),
    border: resolveColor(definition.border),
    text: resolveColor(definition.text),
    favorite: resolveColor(definition.favorite),
    warning: resolveColor(definition.warning),
    danger: resolveColor(definition.danger),
    ...(config.accentColor ? { configuredAccent: config.accentColor } : {}),
    compact: config.compact,
    ascii: config.ascii
  };
};

export interface ThemeGlyphs {
  brand: string;
  cursor: string;
  favorite: string;
  inputCursor: string;
  up: string;
  down: string;
  separator: string;
  enter: string;
  warning: string;
  empty: string;
  launch: string;
  ellipsis: string;
}

const unicodeGlyphs: ThemeGlyphs = {
  brand: '✦',
  cursor: '❯',
  favorite: '★',
  inputCursor: '▊',
  up: '↑',
  down: '↓',
  separator: '•',
  enter: '⏎',
  warning: '⚠',
  empty: '—',
  launch: '⚡',
  ellipsis: '…'
};

const asciiGlyphs: ThemeGlyphs = {
  brand: '*',
  cursor: '>',
  favorite: '*',
  inputCursor: '_',
  up: '^',
  down: 'v',
  separator: '|',
  enter: 'enter',
  warning: '!',
  empty: '-',
  launch: '>',
  ellipsis: '...'
};

export const getThemeGlyphs = (ascii: boolean): ThemeGlyphs =>
  ascii ? asciiGlyphs : unicodeGlyphs;
