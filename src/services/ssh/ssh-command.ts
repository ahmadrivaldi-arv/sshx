import fs from 'node:fs';
import type { SshConnection } from '../../types/connection.js';
import { expandHome } from '../../utils/paths.js';

export interface SshCommand {
  command: string;
  args: string[];
}

const resolveSshCommand = (): string => {
  if (process.platform === 'win32') {
    return 'ssh.exe';
  }

  for (const candidate of [
    '/usr/bin/ssh',
    '/bin/ssh',
    '/usr/local/bin/ssh',
    '/opt/homebrew/bin/ssh'
  ]) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return 'ssh';
};

export const buildSshCommand = (connection: SshConnection): SshCommand => {
  const args = [`${connection.username}@${connection.host}`, '-p', String(connection.port)];

  if (connection.identityFile) {
    args.push('-i', expandHome(connection.identityFile));
  }

  return {
    command: resolveSshCommand(),
    args
  };
};
