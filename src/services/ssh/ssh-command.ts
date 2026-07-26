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
  const args = ['-p', String(connection.port)];

  if (connection.identityFile) {
    args.push('-i', expandHome(connection.identityFile));
  }

  if (connection.suppressWeakCryptoWarning) {
    args.push('-o', 'WarnWeakCrypto=no');
  }

  for (const [name, value] of Object.entries(connection.sshOptions)) {
    if (connection.suppressWeakCryptoWarning && name.toLowerCase() === 'warnweakcrypto') {
      continue;
    }

    args.push('-o', `${name}=${value}`);
  }

  args.push(`${connection.username}@${connection.host}`);

  return {
    command: resolveSshCommand(),
    args
  };
};
