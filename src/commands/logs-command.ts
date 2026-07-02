import fs from 'fs-extra';
import type { Command } from 'commander';
import type { Logger } from '../services/logging/logger.js';

interface LogsOptions {
  lines?: string;
  path?: boolean;
}

export const registerLogsCommand = (program: Command, logger: Logger): void => {
  program
    .command('logs')
    .description('Show Sshx log file')
    .option('-n, --lines <count>', 'Number of lines to show', '80')
    .option('--path', 'Print log file path only')
    .action(async (options: LogsOptions): Promise<void> => {
      const logFile = logger.getLogFile();

      if (options.path) {
        process.stdout.write(`${logFile}\n`);
        return;
      }

      const exists = await fs.pathExists(logFile);

      if (!exists) {
        process.stdout.write(`No log file yet: ${logFile}\n`);
        return;
      }

      const content = await fs.readFile(logFile, 'utf8');
      const lineCount = Number(options.lines ?? '80');
      const lines = content.trimEnd().split('\n').slice(-lineCount);

      process.stdout.write(`${lines.join('\n')}\n`);
    });
};
