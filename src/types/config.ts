import type { SshConnection } from './connection.js';

export interface AppConfig {
  connections: SshConnection[];
  recentConnectionIds: string[];
}

export interface ConfigPaths {
  configDir: string;
  configFile: string;
}
