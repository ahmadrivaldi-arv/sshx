import os from 'node:os';
import path from 'node:path';
import type { ConfigPaths } from '../types/config.js';

export const expandHome = (value: string, homeDirectory = os.homedir()): string => {
  if (value === '~') {
    return homeDirectory;
  }

  if (value.startsWith('~/')) {
    return path.join(homeDirectory, value.slice(2));
  }

  if (value.startsWith('~\\')) {
    return path.join(homeDirectory, value.slice(2));
  }

  return value;
};

interface ConfigPathEnvironment {
  XDG_CONFIG_HOME?: string | undefined;
  LOCALAPPDATA?: string | undefined;
}

interface ConfigPathOptions {
  platform: NodeJS.Platform;
  homeDirectory: string;
  environment?: ConfigPathEnvironment;
}

export const createConfigPaths = ({
  platform,
  homeDirectory,
  environment = {}
}: ConfigPathOptions): ConfigPaths => {
  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  const configBase =
    platform === 'win32'
      ? (environment.LOCALAPPDATA ?? pathApi.join(homeDirectory, 'AppData', 'Local'))
      : platform === 'linux'
        ? (environment.XDG_CONFIG_HOME ?? pathApi.join(homeDirectory, '.config'))
        : pathApi.join(homeDirectory, '.config');
  const configDir = pathApi.join(configBase, 'sshx');

  return {
    configDir,
    configFile: pathApi.join(configDir, 'config.json')
  };
};

export const createDefaultConfigPaths = (): ConfigPaths =>
  createConfigPaths({
    platform: process.platform,
    homeDirectory: os.homedir(),
    environment: process.env
  });
