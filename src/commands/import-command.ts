import type { Command } from 'commander';
import type { ImportService } from '../services/ssh/import-service.js';

interface ImportOptions {
  file?: string;
}

export const registerImportCommand = (program: Command, service: ImportService): void => {
  program
    .command('import')
    .description('Import connections from ~/.ssh/config')
    .option('-f, --file <file>', 'SSH config file', '~/.ssh/config')
    .action(async (options: ImportOptions): Promise<void> => {
      const imported = await service.importSshConfig(options.file);
      process.stdout.write(`Imported ${imported.length} connection(s)\n`);
    });
};
