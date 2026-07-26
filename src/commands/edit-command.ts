import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionColor, ConnectionPatch } from '../types/connection.js';
import { parseSshOptions } from '../services/ssh/ssh-options.js';

interface EditOptions {
  name?: string;
  host?: string;
  username?: string;
  port?: string;
  identityFile?: string;
  group?: string;
  tags?: string;
  color?: ConnectionColor;
  passwordEnv?: string;
  clearPassword?: boolean;
  clearIdentityFile?: boolean;
  clearGroup?: boolean;
  sshOption?: string[];
  clearSshOptions?: boolean;
  suppressWeakCryptoWarning?: boolean;
  showWeakCryptoWarning?: boolean;
}

const collectOption = (value: string, previous: string[]): string[] => [...previous, value];

export const registerEditCommand = (program: Command, service: ConnectionService): void => {
  program
    .command('edit')
    .description('Edit an SSH connection by id')
    .argument('<id>', 'Connection id')
    .option('--name <name>', 'Connection name')
    .option('--host <host>', 'SSH host')
    .option('-u, --username <username>', 'SSH username')
    .option('-p, --port <port>', 'SSH port')
    .option('-i, --identity-file <file>', 'Identity file')
    .option('--clear-identity-file', 'Remove the identity file')
    .option('-g, --group <group>', 'Connection group')
    .option('--clear-group', 'Remove the connection group')
    .option('-t, --tags <tags>', 'Comma separated tags')
    .option('-c, --color <color>', 'Display color')
    .option('--password-env <name>', 'Read SSH password from an environment variable')
    .option('--clear-password', 'Remove the stored password')
    .option(
      '-o, --ssh-option <key=value>',
      'Replace OpenSSH options (repeatable)',
      collectOption,
      []
    )
    .option('--clear-ssh-options', 'Remove all OpenSSH options')
    .option('--suppress-weak-crypto-warning', 'Pass WarnWeakCrypto=no to OpenSSH')
    .option('--show-weak-crypto-warning', 'Stop suppressing the OpenSSH weak crypto warning')
    .action(async (id: string, options: EditOptions): Promise<void> => {
      if (options.clearPassword && options.passwordEnv) {
        throw new Error('Use either --clear-password or --password-env, not both');
      }

      if (options.clearIdentityFile && options.identityFile) {
        throw new Error('Use either --clear-identity-file or --identity-file, not both');
      }

      if (options.clearGroup && options.group) {
        throw new Error('Use either --clear-group or --group, not both');
      }

      if (options.clearSshOptions && (options.sshOption?.length ?? 0) > 0) {
        throw new Error('Use either --clear-ssh-options or --ssh-option, not both');
      }

      if (options.suppressWeakCryptoWarning && options.showWeakCryptoWarning) {
        throw new Error(
          'Use either --suppress-weak-crypto-warning or --show-weak-crypto-warning, not both'
        );
      }

      const password = options.passwordEnv ? process.env[options.passwordEnv] : undefined;
      const port = options.port ? Number(options.port) : undefined;
      const hasSshOptions = (options.sshOption?.length ?? 0) > 0;

      if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
        throw new Error('Port must be an integer from 1 to 65535');
      }

      if (options.passwordEnv && password === undefined) {
        throw new Error(`Environment variable "${options.passwordEnv}" is not set`);
      }

      const patch: ConnectionPatch = {
        ...(options.name ? { name: options.name } : {}),
        ...(options.host ? { host: options.host } : {}),
        ...(options.username ? { username: options.username } : {}),
        ...(port !== undefined ? { port } : {}),
        ...(options.clearIdentityFile
          ? { identityFile: null }
          : options.identityFile
            ? { identityFile: options.identityFile }
            : {}),
        ...(options.clearGroup ? { group: null } : options.group ? { group: options.group } : {}),
        ...(options.tags
          ? {
              tags: options.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            }
          : {}),
        ...(options.color ? { color: options.color } : {}),
        ...(options.clearPassword ? { password: null } : password ? { password } : {}),
        ...(options.clearSshOptions
          ? { sshOptions: {} }
          : hasSshOptions
            ? { sshOptions: parseSshOptions(options.sshOption ?? []) }
            : {}),
        ...(options.suppressWeakCryptoWarning
          ? { suppressWeakCryptoWarning: true }
          : options.showWeakCryptoWarning
            ? { suppressWeakCryptoWarning: false }
            : {})
      };

      const connection = await service.update(id, patch);
      process.stdout.write(`Updated ${connection.name}\n`);
    });
};
