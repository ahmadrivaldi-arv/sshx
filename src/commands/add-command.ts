import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionColor, ConnectionInput } from '../types/connection.js';
import { parseSshOptions } from '../services/ssh/ssh-options.js';

interface AddOptions {
  host: string;
  username: string;
  port?: string;
  identityFile?: string;
  group?: string;
  tags?: string;
  color?: ConnectionColor;
  favorite?: boolean;
  passwordEnv?: string;
  sshOption?: string[];
  suppressWeakCryptoWarning?: boolean;
}

const collectOption = (value: string, previous: string[]): string[] => [...previous, value];

export const registerAddCommand = (program: Command, service: ConnectionService): void => {
  program
    .command('add')
    .description('Add a new SSH connection')
    .argument('<name>', 'Connection name')
    .requiredOption('--host <host>', 'SSH host')
    .requiredOption('-u, --username <username>', 'SSH username')
    .option('-p, --port <port>', 'SSH port', '22')
    .option('-i, --identity-file <file>', 'Identity file')
    .option('-g, --group <group>', 'Connection group')
    .option('-t, --tags <tags>', 'Comma separated tags')
    .option('-c, --color <color>', 'Display color')
    .option('--favorite', 'Mark as favorite')
    .option('--password-env <name>', 'Read SSH password from an environment variable')
    .option('-o, --ssh-option <key=value>', 'Set an OpenSSH option (repeatable)', collectOption, [])
    .option('--suppress-weak-crypto-warning', 'Pass WarnWeakCrypto=no to OpenSSH')
    .action(async (name: string, options: AddOptions): Promise<void> => {
      const password = options.passwordEnv ? process.env[options.passwordEnv] : undefined;
      const port = Number(options.port ?? '22');

      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('Port must be an integer from 1 to 65535');
      }

      if (options.passwordEnv && password === undefined) {
        throw new Error(`Environment variable "${options.passwordEnv}" is not set`);
      }

      const input: ConnectionInput = {
        name,
        host: options.host,
        username: options.username,
        port,
        ...(options.identityFile ? { identityFile: options.identityFile } : {}),
        ...(options.group ? { group: options.group } : {}),
        tags: options.tags
          ? options.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        ...(options.color ? { color: options.color } : {}),
        ...(password ? { password } : {}),
        favorite: options.favorite ?? false,
        sshOptions: parseSshOptions(options.sshOption ?? []),
        suppressWeakCryptoWarning: options.suppressWeakCryptoWarning ?? false
      };

      const connection = await service.add(input);
      process.stdout.write(`Added ${connection.name}\n`);
    });
};
