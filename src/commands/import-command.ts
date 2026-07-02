import type { Command } from 'commander';
import type { ImportFormat, ImportService } from '../services/ssh/import-service.js';

interface ImportOptions {
  file?: string;
  format?: ImportFormat;
}

export const registerImportCommand = (program: Command, service: ImportService): void => {
  program
    .command('import')
    .description('Import connections from ~/.ssh/config or Sshx JSON/YAML export')
    .option('-f, --file <file>', 'Input file', '~/.ssh/config')
    .option('--format <format>', 'ssh-config, json, or yaml')
    .action(async (options: ImportOptions): Promise<void> => {
      const format = options.format;

      if (format && format !== 'ssh-config' && format !== 'json' && format !== 'yaml') {
        throw new Error('Format must be ssh-config, json, or yaml');
      }

      const imported = await service.importFile(options.file, format);
      process.stdout.write(`Imported ${imported.length} connection(s)\n`);
    });
};
