#!/usr/bin/env node
import React from 'react';
import { Command } from 'commander';
import { render } from 'ink';
import { registerAddCommand } from '../commands/add-command.js';
import { registerConnectCommand } from '../commands/connect-command.js';
import { registerEditCommand } from '../commands/edit-command.js';
import { registerExportCommand } from '../commands/export-command.js';
import { registerImportCommand } from '../commands/import-command.js';
import { registerListCommand } from '../commands/list-command.js';
import { registerLogsCommand } from '../commands/logs-command.js';
import { registerMutationCommands } from '../commands/mutation-commands.js';
import { App } from '../layouts/App.js';
import { ConnectionService } from '../services/config/connection-service.js';
import { Logger } from '../services/logging/logger.js';
import { ExportService } from '../services/ssh/export-service.js';
import { ImportService } from '../services/ssh/import-service.js';
import { PtySshSession } from '../services/ssh/pty-ssh-session.js';
import { SecretService } from '../services/ssh/secret-service.js';
import type { SshConnection } from '../types/connection.js';
import { handleCliError } from '../utils/error-handler.js';
import packageJson from '../../package.json' with { type: 'json' };

const runTui = async (
  connectionService: ConnectionService,
  session: PtySshSession
): Promise<void> => {
  process.stdout.write('\x1Bc');
  let selectedConnection: SshConnection | undefined;
  const instance = render(
    <App
      connectionService={connectionService}
      onConnect={(connection) => {
        selectedConnection = connection;
      }}
    />
  );

  await instance.waitUntilExit();

  if (selectedConnection) {
    await connectionService.markRecent(selectedConnection.id);
    const exitCode = await session.connect(selectedConnection);
    process.exitCode = exitCode;
  }
};

const main = async (): Promise<void> => {
  const secretService = new SecretService();
  const connectionService = new ConnectionService(undefined, secretService);
  const logger = new Logger();
  const importService = new ImportService(connectionService);
  const exportService = new ExportService(connectionService);
  const session = new PtySshSession(logger, secretService);
  const program = new Command();

  program
    .name('sshx')
    .description('A modern terminal SSH manager')
    .version(packageJson.version)
    .action(async (): Promise<void> => {
      await runTui(connectionService, session);
    });

  registerAddCommand(program, connectionService);
  registerEditCommand(program, connectionService);
  registerListCommand(program, connectionService);
  registerMutationCommands(program, connectionService);
  registerImportCommand(program, importService);
  registerExportCommand(program, exportService);
  registerConnectCommand(program, connectionService, session);
  registerLogsCommand(program, logger);

  await program.parseAsync(process.argv);
};

main().catch(handleCliError);
