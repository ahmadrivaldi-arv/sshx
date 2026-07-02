import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionColor, ConnectionPatch } from '../types/connection.js';

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
}

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
    .option('-g, --group <group>', 'Connection group')
    .option('-t, --tags <tags>', 'Comma separated tags')
    .option('-c, --color <color>', 'Display color')
    .option('--password-env <name>', 'Read SSH password from an environment variable')
    .action(async (id: string, options: EditOptions): Promise<void> => {
      const password = options.passwordEnv ? process.env[options.passwordEnv] : undefined;
      const patch: ConnectionPatch = {
        ...(options.name ? { name: options.name } : {}),
        ...(options.host ? { host: options.host } : {}),
        ...(options.username ? { username: options.username } : {}),
        ...(options.port ? { port: Number(options.port) } : {}),
        ...(options.identityFile ? { identityFile: options.identityFile } : {}),
        ...(options.group ? { group: options.group } : {}),
        ...(options.tags
          ? {
              tags: options.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            }
          : {}),
        ...(options.color ? { color: options.color } : {}),
        ...(password ? { password } : {})
      };

      const connection = await service.update(id, patch);
      process.stdout.write(`Updated ${connection.name}\n`);
    });
};
