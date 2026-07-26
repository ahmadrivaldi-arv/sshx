import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionHealthService } from '../services/ssh/connection-health-service.js';

interface CheckOptions {
  all?: boolean;
  timeout?: string;
}

export const registerCheckCommand = (
  program: Command,
  connectionService: ConnectionService,
  healthService: ConnectionHealthService
): void => {
  program
    .command('check')
    .description('Check SSH reachability for one or all connections')
    .argument('[target]', 'Connection id or exact name')
    .option('-a, --all', 'Check every configured connection')
    .option('--timeout <seconds>', 'Timeout per connection in seconds', '5')
    .action(async (target: string | undefined, options: CheckOptions): Promise<void> => {
      const timeoutSeconds = Number(options.timeout);
      if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
        throw new Error('Timeout must be a positive number of seconds');
      }

      const connections = await connectionService.list();
      const selected = options.all
        ? connections
        : connections.filter(
            (connection) => connection.id === target || connection.name === target
          );

      if (!options.all && !target) {
        throw new Error('Provide a connection target or use --all');
      }
      if (selected.length === 0) {
        throw new Error(`Connection "${target}" was not found`);
      }

      const results = await healthService.checkMany(selected, timeoutSeconds * 1000);
      for (const result of results) {
        process.stdout.write(
          `${result.status.padEnd(13)} ${result.connection.name} (${result.connection.host}:${result.connection.port})\n`
        );
      }
    });
};
