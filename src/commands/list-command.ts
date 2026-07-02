import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';

interface ListOptions {
  search?: string;
  group?: string;
  tags?: string;
}

export const registerListCommand = (program: Command, service: ConnectionService): void => {
  program
    .command('list')
    .description('List configured SSH connections')
    .option('-s, --search <query>', 'Search query')
    .option('-g, --group <group>', 'Filter by group')
    .option('-t, --tags <tags>', 'Comma separated tags')
    .action(async (options: ListOptions): Promise<void> => {
      const connections = await service.list({
        ...(options.search ? { search: options.search } : {}),
        ...(options.group ? { group: options.group } : {}),
        tags: options.tags
          ? options.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : []
      });

      for (const connection of connections) {
        process.stdout.write(
          `${connection.id}  ${connection.favorite ? '*' : ' '}  ${connection.name}  ${connection.username}@${connection.host}:${connection.port}\n`
        );
      }
    });
};
