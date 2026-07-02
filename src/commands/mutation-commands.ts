import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';

export const registerMutationCommands = (program: Command, service: ConnectionService): void => {
  program
    .command('delete')
    .description('Delete an SSH connection by id')
    .argument('<id>', 'Connection id')
    .action(async (id: string): Promise<void> => {
      await service.delete(id);
      process.stdout.write('Deleted connection\n');
    });

  program
    .command('duplicate')
    .description('Duplicate an SSH connection by id')
    .argument('<id>', 'Connection id')
    .action(async (id: string): Promise<void> => {
      const connection = await service.duplicate(id);
      process.stdout.write(`Duplicated as ${connection.name}\n`);
    });

  program
    .command('rename')
    .description('Rename an SSH connection by id')
    .argument('<id>', 'Connection id')
    .argument('<name>', 'New name')
    .action(async (id: string, name: string): Promise<void> => {
      const connection = await service.rename(id, name);
      process.stdout.write(`Renamed to ${connection.name}\n`);
    });

  program
    .command('favorite')
    .description('Toggle favorite status by id')
    .argument('<id>', 'Connection id')
    .action(async (id: string): Promise<void> => {
      const connection = await service.toggleFavorite(id);
      process.stdout.write(
        `${connection.favorite ? 'Favorited' : 'Unfavorited'} ${connection.name}\n`
      );
    });
};
