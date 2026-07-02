import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionColor, ConnectionInput } from '../types/connection.js';

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
}

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
    .action(async (name: string, options: AddOptions): Promise<void> => {
      const password = options.passwordEnv ? process.env[options.passwordEnv] : undefined;
      const input: ConnectionInput = {
        name,
        host: options.host,
        username: options.username,
        port: Number(options.port ?? '22'),
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
        favorite: options.favorite ?? false
      };

      const connection = await service.add(input);
      process.stdout.write(`Added ${connection.name}\n`);
    });
};
