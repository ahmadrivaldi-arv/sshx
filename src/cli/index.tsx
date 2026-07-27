#!/usr/bin/env node
import React from 'react';
import { Command } from 'commander';
import { render } from 'ink';
import { registerAddCommand } from '../commands/add-command.js';
import { registerBackupCommands } from '../commands/backup-command.js';
import { registerCheckCommand } from '../commands/check-command.js';
import { registerConnectCommand } from '../commands/connect-command.js';
import { registerEditCommand } from '../commands/edit-command.js';
import { registerExportCommand } from '../commands/export-command.js';
import { registerImportCommand } from '../commands/import-command.js';
import { registerListCommand } from '../commands/list-command.js';
import { registerLogsCommand } from '../commands/logs-command.js';
import { registerMutationCommands } from '../commands/mutation-commands.js';
import { registerSnippetCommand } from '../commands/snippet-command.js';
import { registerThemeCommand } from '../commands/theme-command.js';
import { App } from '../layouts/App.js';
import { BackupService } from '../services/backup/backup-service.js';
import { ConfigService } from '../services/config/config-service.js';
import { ConnectionService } from '../services/config/connection-service.js';
import { SnippetService } from '../services/config/snippet-service.js';
import { ThemeService } from '../services/config/theme-service.js';
import { Logger } from '../services/logging/logger.js';
import type { ExternalPaletteCommand } from '../services/palette/command-palette.js';
import { ExportService } from '../services/ssh/export-service.js';
import { ImportService } from '../services/ssh/import-service.js';
import { ConnectionHealthService } from '../services/ssh/connection-health-service.js';
import { PtySshSession } from '../services/ssh/pty-ssh-session.js';
import { SecretService } from '../services/ssh/secret-service.js';
import type { SshConnection } from '../types/connection.js';
import { handleCliError } from '../utils/error-handler.js';
import packageJson from '../../package.json' with { type: 'json' };

const runTui = async (
  connectionService: ConnectionService,
  healthService: ConnectionHealthService,
  session: PtySshSession,
  themeService: ThemeService,
  onPaletteCommand: (command: ExternalPaletteCommand, args: string[]) => Promise<string>
): Promise<void> => {
  const useAlternateScreen = Boolean(process.stdout.isTTY);

  while (true) {
    let selectedConnection: SshConnection | undefined;
    if (useAlternateScreen) {
      process.stdout.write('\x1B[?1049h\x1B[2J\x1B[H');
    }
    try {
      const instance = render(
        <App
          connectionService={connectionService}
          healthService={healthService}
          onPaletteCommand={onPaletteCommand}
          theme={await themeService.getResolved()}
          onConnect={(connection) => {
            selectedConnection = connection;
          }}
        />
      );
      try {
        await instance.waitUntilExit();
      } finally {
        instance.clear();
      }
    } finally {
      if (useAlternateScreen) {
        process.stdout.write('\x1B[?1049l');
      }
    }

    if (!selectedConnection) return;
    const startedAt = Date.now();
    const exitCode = await session.connect(selectedConnection);
    await connectionService.recordConnection(
      selectedConnection.id,
      exitCode === 0 ? 'success' : 'failed',
      Date.now() - startedAt
    );
  }
};

const main = async (): Promise<void> => {
  const secretService = new SecretService();
  const configService = new ConfigService();
  const connectionService = new ConnectionService(configService, secretService);
  const snippetService = new SnippetService(configService);
  const themeService = new ThemeService(configService);
  const logger = new Logger();
  const importService = new ImportService(connectionService);
  const backupService = new BackupService(configService);
  const healthService = new ConnectionHealthService(connectionService);
  const exportService = new ExportService(connectionService);
  const session = new PtySshSession(logger, secretService, snippetService);
  const program = new Command();
  const onPaletteCommand = async (
    command: ExternalPaletteCommand,
    args: string[]
  ): Promise<string> => {
    if (command === 'logs') {
      return `Logs: ${logger.getLogFile()}`;
    }
    if (command === 'theme') {
      const name = args[0];
      if (!name) throw new Error('Usage: :theme <name>');
      const resolved = await themeService.update({ name });
      return `Theme set to ${resolved.name}; restart the TUI to apply it`;
    }
    if (command === 'snippet') {
      const query = args.join(' ').trim();
      const snippets = await snippetService.list(query ? { search: query } : {});
      if (snippets.length === 0) return 'No matching snippets';
      return snippets
        .slice(0, 3)
        .map(({ name, command: snippetCommand }) => `${name}: ${snippetCommand}`)
        .join(' | ');
    }
    if (command === 'export') {
      const file = args[0];
      if (!file) throw new Error('Usage: :export <file>');
      const format = /\.ya?ml$/i.test(file) ? 'yaml' : 'json';
      await exportService.export(file, format);
      return `Exported connections to ${file}`;
    }

    const file = args[0];
    if (!file) {
      throw new Error('Usage: :import <file> [--apply] [--strategy=skip|overwrite|rename]');
    }
    const strategyArgument = args.find((argument) => argument.startsWith('--strategy='));
    const strategy = strategyArgument?.slice('--strategy='.length) ?? 'skip';
    if (strategy !== 'skip' && strategy !== 'overwrite' && strategy !== 'rename') {
      throw new Error('Import strategy must be skip, overwrite, or rename');
    }
    const preview = await importService.previewFile(file, undefined, strategy);
    const summary = `${preview.add} add, ${preview.overwrite} overwrite, ${preview.rename} rename, ${preview.skip} skip`;
    if (!args.includes('--apply')) {
      return `Import preview: ${summary}; add --apply to save`;
    }
    const imported = await importService.applyPreview(preview);
    return `Imported ${imported.length} connection(s): ${summary}`;
  };

  program
    .name('sshx')
    .description('A modern terminal SSH manager')
    .version(packageJson.version)
    .action(async (): Promise<void> => {
      await runTui(connectionService, healthService, session, themeService, onPaletteCommand);
    });

  registerAddCommand(program, connectionService);
  registerBackupCommands(program, backupService);
  registerEditCommand(program, connectionService);
  registerListCommand(program, connectionService);
  registerMutationCommands(program, connectionService);
  registerSnippetCommand(program, snippetService);
  registerImportCommand(program, importService);
  registerCheckCommand(program, connectionService, healthService);
  registerExportCommand(program, exportService);
  registerConnectCommand(program, connectionService, session);
  registerLogsCommand(program, logger);
  registerThemeCommand(program, themeService);

  await program.parseAsync(process.argv);
};

main().catch(handleCliError);
