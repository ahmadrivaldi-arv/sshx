import os from 'node:os';
import path from 'node:path';
import type { ConfigPaths } from '../types/config.js';

export const expandHome = (value: string): string => {
  if (value === '~') {
    return os.homedir();
  }

  if (value.startsWith('~/')) {
    return path.join(os.homedir(), value.slice(2));
  }

  if (value.startsWith('~\\')) {
    return path.join(os.homedir(), value.slice(2));
  }

  return value;
};

export const createDefaultConfigPaths = (): ConfigPaths => {
  const configBase =
    process.platform === 'win32'
      ? (process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'))
      : process.platform === 'linux'
        ? (process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'))
        : path.join(os.homedir(), '.config');
  const configDir = path.join(configBase, 'sshx');

  return {
    configDir,
    configFile: path.join(configDir, 'config.json')
  };
};
