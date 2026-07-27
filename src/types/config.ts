import type { SshConnection } from './connection.js';
import type { KeymapConfig } from './keymap.js';
import type { CommandSnippet } from './snippet.js';
import type { ThemeConfig } from './theme.js';

export interface AppConfig {
  configVersion: 2;
  connections: SshConnection[];
  recentConnectionIds: string[];
  snippets: CommandSnippet[];
  keymap: KeymapConfig;
  theme: ThemeConfig;
}

export interface ConfigPaths {
  configDir: string;
  configFile: string;
}
