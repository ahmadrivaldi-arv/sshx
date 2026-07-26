import chalk from 'chalk';
import { toAppError, type AppError } from './app-error.js';

const errorHints: Partial<Record<AppError['code'], string>> = {
  CONFIG_INVALID: 'Fix the reported field in config.json or restore a valid backup.',
  CONFIG_VERSION_UNSUPPORTED: 'Install a newer Sshx release before using this config.',
  CONNECTION_NOT_FOUND: 'Run "sshx list" to find the connection id.',
  CONNECTION_DUPLICATE: 'Choose a unique name or SSH endpoint.',
  IMPORT_FAILED: 'Run the import without --apply first and review the preview.',
  BACKUP_INVALID: 'Run "sshx restore <file> --validate-only" for a safe validation check.',
  SECRET_FAILED: 'Verify that the operating-system credential service is available.',
  SSH_FAILED: 'Check OpenSSH availability, connection health, and the Sshx logs.'
};

export const formatCliError = (error: unknown): { heading: string; hint?: string } => {
  const appError = toAppError(error);
  const hint = errorHints[appError.code];
  return {
    heading: `Error [${appError.code}]: ${appError.message}`,
    ...(hint ? { hint } : {})
  };
};

export const handleCliError = (error: unknown): never => {
  const formatted = formatCliError(error);
  process.stderr.write(`${chalk.red(formatted.heading)}\n`);
  if (formatted.hint) {
    process.stderr.write(`${chalk.yellow('Hint')}: ${formatted.hint}\n`);
  }
  process.exit(1);
};
