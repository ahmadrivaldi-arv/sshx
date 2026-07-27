import type { Command } from 'commander';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { PtySshSession } from '../services/ssh/pty-ssh-session.js';

export const registerConnectCommand = (
  program: Command,
  connectionService: ConnectionService,
  session: PtySshSession
): void => {
  program
    .command('connect')
    .alias('ssh')
    .description('Connect to an SSH connection by id or exact name')
    .argument('<target>', 'Connection id or name')
    .action(async (target: string): Promise<void> => {
      const connections = await connectionService.list();
      const connection = connections.find((item) => item.id === target || item.name === target);

      if (!connection) {
        throw new Error(`Connection "${target}" was not found`);
      }

      const startedAt = Date.now();
      const exitCode = await session.connect(connection);
      await connectionService.recordConnection(
        connection.id,
        exitCode === 0 ? 'success' : 'failed',
        Date.now() - startedAt
      );
      process.exitCode = exitCode;
    });
};
