import fs from 'fs-extra';
import path from 'node:path';
import { createDefaultConfigPaths } from '../../utils/paths.js';

export type LogLevel = 'info' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, string | number | boolean | undefined> | undefined;
}

export class Logger {
  private readonly logFile: string;

  public constructor(
    logFile = path.join(createDefaultConfigPaths().configDir, 'logs', 'sshx.log')
  ) {
    this.logFile = logFile;
  }

  public getLogFile(): string {
    return this.logFile;
  }

  public async info(message: string, context?: LogEntry['context']): Promise<void> {
    await this.write({ level: 'info', message, context });
  }

  public async error(message: string, context?: LogEntry['context']): Promise<void> {
    await this.write({ level: 'error', message, context });
  }

  private async write(entry: LogEntry): Promise<void> {
    const timestamp = new Date().toISOString();
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const line = `[${timestamp}] ${entry.level.toUpperCase()} ${entry.message}${context}\n`;

    await fs.ensureDir(path.dirname(this.logFile));
    await fs.appendFile(this.logFile, line, 'utf8');
  }
}
