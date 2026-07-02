import chalk from 'chalk';
import { toAppError } from './app-error.js';

export const handleCliError = (error: unknown): never => {
  const appError = toAppError(error);
  const prefix = chalk.red(`Error [${appError.code}]`);

  process.stderr.write(`${prefix}: ${appError.message}\n`);
  process.exit(1);
};
