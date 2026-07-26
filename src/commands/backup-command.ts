import type { Command } from 'commander';
import type {
  BackupFormat,
  BackupService,
  RestoreStrategy
} from '../services/backup/backup-service.js';

interface BackupOptions {
  format?: BackupFormat;
}

interface RestoreOptions extends BackupOptions {
  strategy?: RestoreStrategy;
  validateOnly?: boolean;
}

const validateFormat = (format?: string): BackupFormat | undefined => {
  if (format === 'json' || format === 'yaml') return format;
  if (format) throw new Error('Format must be json or yaml');
  return undefined;
};

export const registerBackupCommands = (program: Command, service: BackupService): void => {
  program
    .command('backup')
    .description('Back up the full Sshx configuration without secrets')
    .argument('<file>', 'Backup destination')
    .option('--format <format>', 'json or yaml')
    .action(async (file: string, options: BackupOptions): Promise<void> => {
      const backup = await service.backup(file, validateFormat(options.format));
      process.stdout.write(
        `Backed up ${backup.config.connections.length} connection(s) to ${file}\n`
      );
    });

  program
    .command('restore')
    .description('Validate and restore an Sshx backup')
    .argument('<file>', 'Backup source')
    .option('--format <format>', 'json or yaml')
    .option(
      '--strategy <strategy>',
      'Conflict strategy: skip, overwrite, rename, or replace',
      'skip'
    )
    .option('--validate-only', 'Validate the backup without changing configuration')
    .action(async (file: string, options: RestoreOptions): Promise<void> => {
      const format = validateFormat(options.format);
      const strategy = options.strategy ?? 'skip';
      if (
        strategy !== 'skip' &&
        strategy !== 'overwrite' &&
        strategy !== 'rename' &&
        strategy !== 'replace'
      ) {
        throw new Error('Strategy must be skip, overwrite, rename, or replace');
      }

      if (options.validateOnly) {
        const backup = await service.validate(file, format);
        process.stdout.write(
          `Valid backup v${backup.backupVersion}: ${backup.config.connections.length} connection(s)\n`
        );
        return;
      }

      const result = await service.restore(file, strategy, format);
      process.stdout.write(
        `Restored: ${result.added} added, ${result.overwritten} overwritten, ${result.renamed} renamed, ${result.skipped} skipped, ${result.replaced} replaced\n`
      );
    });
};
