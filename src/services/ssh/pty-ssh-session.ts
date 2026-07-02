import process from 'node:process';
import pty from 'node-pty';
import type { SshConnection } from '../../types/connection.js';
import { AppError } from '../../utils/app-error.js';
import { Logger } from '../logging/logger.js';
import { SecretService } from './secret-service.js';
import { buildSshCommand } from './ssh-command.js';

export class PtySshSession {
  private readonly logger: Logger;
  private readonly secretService: SecretService;

  public constructor(
    logger: Logger = new Logger(),
    secretService: SecretService = new SecretService()
  ) {
    this.logger = logger;
    this.secretService = secretService;
  }

  public async connect(connection: SshConnection): Promise<number> {
    const { command, args } = buildSshCommand(connection);
    const password = connection.passwordSecretRef
      ? await this.secretService.getPassword(connection.passwordSecretRef)
      : undefined;
    let passwordSent = false;
    let outputBuffer = '';

    try {
      process.stdout.write('\x1Bc');
      await this.logger.info('Starting SSH session', {
        connectionId: connection.id,
        name: connection.name,
        command,
        args: args.join(' '),
        host: connection.host,
        username: connection.username,
        port: connection.port
      });

      return await new Promise<number>((resolve) => {
        const shell = pty.spawn(command, args, {
          name: 'xterm-256color',
          cols: process.stdout.columns || 80,
          rows: process.stdout.rows || 24,
          cwd: process.cwd(),
          env: process.env
        });
        let settled = false;

        const resize = (): void => {
          shell.resize(process.stdout.columns || 80, process.stdout.rows || 24);
        };

        const onInput = (data: Buffer): void => {
          shell.write(data.toString());
        };

        const cleanup = (): void => {
          process.stdout.off('resize', resize);
          process.stdin.off('data', onInput);
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
        };

        const finish = (exitCode: number): void => {
          if (settled) {
            return;
          }

          settled = true;
          cleanup();
          void this.logger.info('SSH session exited', {
            connectionId: connection.id,
            name: connection.name,
            exitCode
          });
          resolve(exitCode);
        };

        const onSignal = (): void => {
          shell.write('\x03');
        };

        process.once('SIGINT', onSignal);
        process.once('SIGTERM', onSignal);
        process.stdin.setRawMode?.(true);
        process.stdin.resume();
        process.stdin.on('data', onInput);
        shell.onData((data) => {
          process.stdout.write(data);

          if (!password || passwordSent) {
            return;
          }

          outputBuffer = `${outputBuffer}${data}`.slice(-200);

          if (/password:/i.test(outputBuffer)) {
            passwordSent = true;
            shell.write(`${password}\r`);
          }
        });
        process.stdout.on('resize', resize);

        shell.onExit(({ exitCode }) => {
          process.off('SIGINT', onSignal);
          process.off('SIGTERM', onSignal);
          finish(exitCode);
        });
      });
    } catch (error) {
      await this.logger.error('Failed to start SSH session', {
        connectionId: connection.id,
        name: connection.name,
        command,
        args: args.join(' '),
        host: connection.host,
        port: connection.port,
        reason: error instanceof Error ? error.message : String(error)
      });
      throw new AppError('SSH_FAILED', `Failed to start SSH session for ${connection.name}`, error);
    }
  }
}
