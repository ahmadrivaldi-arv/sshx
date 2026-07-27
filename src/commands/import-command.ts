import type { Command } from 'commander';
import type {
  DuplicateStrategy,
  ImportFormat,
  ImportService
} from '../services/ssh/import-service.js';

interface ImportOptions {
  file?: string;
  format?: ImportFormat;
  strategy?: DuplicateStrategy;
  apply?: boolean;
}

export const registerImportCommand = (program: Command, service: ImportService): void => {
  program
    .command('import')
    .description('Import connections from ~/.ssh/config or Sshx JSON/YAML export')
    .option('-f, --file <file>', 'Input file', '~/.ssh/config')
    .option('--format <format>', 'ssh-config, json, or yaml')
    .option('--strategy <strategy>', 'Duplicate strategy: skip, overwrite, or rename', 'skip')
    .option('--apply', 'Apply the displayed import plan')
    .action(async (options: ImportOptions): Promise<void> => {
      const format = options.format;
      const strategy = options.strategy ?? 'skip';

      if (format && format !== 'ssh-config' && format !== 'json' && format !== 'yaml') {
        throw new Error('Format must be ssh-config, json, or yaml');
      }
      if (strategy !== 'skip' && strategy !== 'overwrite' && strategy !== 'rename') {
        throw new Error('Strategy must be skip, overwrite, or rename');
      }

      const preview = await service.previewFile(options.file, format, strategy);
      for (const item of preview.items) {
        const duplicate = item.duplicateName ? ` (matches ${item.duplicateName})` : '';
        process.stdout.write(`${item.action.padEnd(9)} ${item.input.name}${duplicate}\n`);
      }
      process.stdout.write(
        `Plan: ${preview.add} add, ${preview.overwrite} overwrite, ${preview.rename} rename, ${preview.skip} skip\n`
      );

      if (!options.apply) {
        process.stdout.write('Preview only. Run again with --apply to save these changes.\n');
        return;
      }

      const imported = await service.applyPreview(preview);
      process.stdout.write(`Imported ${imported.length} connection(s)\n`);
    });
};
