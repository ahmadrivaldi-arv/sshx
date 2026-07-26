import type { SshConnection } from './connection.js';
import type { ThemeConfig } from './theme.js';

export interface AppConfig {
  configVersion: 1;
  connections: SshConnection[];
  recentConnectionIds: string[];
  theme: ThemeConfig;
}

export interface ConfigPaths {
  configDir: string;
  configFile: string;
}
