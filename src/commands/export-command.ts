import type { Command } from 'commander';
import type { ExportFormat, ExportService } from '../services/ssh/export-service.js';

interface ExportOptions {
  format?: ExportFormat;
}

export const registerExportCommand = (program: Command, service: ExportService): void => {
  program
    .command('export')
    .description('Export connections to JSON or YAML')
    .argument('<file>', 'Output file')
    .option('-f, --format <format>', 'json or yaml', 'json')
    .action(async (file: string, options: ExportOptions): Promise<void> => {
      const format = options.format ?? 'json';

      if (format !== 'json' && format !== 'yaml') {
        throw new Error('Format must be json or yaml');
      }

      await service.export(file, format);
      process.stdout.write(`Exported ${file}\n`);
    });
};
