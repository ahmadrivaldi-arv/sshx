export const themeNames = [
  'default',
  'minimal',
  'mono',
  'dracula',
  'nord',
  'catppuccin',
  'tokyo-night'
] as const;

export type BuiltInThemeName = (typeof themeNames)[number];
export type ThemeName = string;

export interface ThemeConfig {
  name: ThemeName;
  accentColor?: string | undefined;
  compact: boolean;
  ascii: boolean;
}

export interface ThemeConfigPatch {
  name?: ThemeName | undefined;
  accentColor?: string | null | undefined;
  compact?: boolean | undefined;
  ascii?: boolean | undefined;
}

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  description: string;
  accent: string;
  muted: string;
  border: string;
  text: string;
  favorite: string;
  warning: string;
  danger: string;
  decorated: boolean;
  useConnectionColors: boolean;
  source: 'built-in' | 'custom';
}

export interface ResolvedTheme extends ThemeDefinition {
  configuredAccent?: string | undefined;
  compact: boolean;
  ascii: boolean;
}

export interface CustomThemeFile {
  name: string;
  label: string;
  description: string;
  colors: {
    accent: string;
    muted: string;
    border: string;
    text: string;
    favorite: string;
    warning: string;
    danger: string;
  };
  decorated: boolean;
  useConnectionColors: boolean;
}
