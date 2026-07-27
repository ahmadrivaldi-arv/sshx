import process from 'node:process';
import pty from 'node-pty';
import type { SshConnection } from '../../types/connection.js';
import { AppError } from '../../utils/app-error.js';
import { KeymapService } from '../config/keymap-service.js';
import { SnippetService } from '../config/snippet-service.js';
import { Logger } from '../logging/logger.js';
import { normalizeNativeTerminalInput, routeSessionInput } from './session-input-router.js';
import { SessionSnippetPicker } from './session-snippet-picker.js';
import { SecretService } from './secret-service.js';
import { buildSshCommand } from './ssh-command.js';

export class PtySshSession {
  private readonly logger: Logger;
  private readonly secretService: SecretService;
  private readonly snippetService: SnippetService;
  private readonly keymapService: KeymapService;

  public constructor(
    logger: Logger = new Logger(),
    secretService: SecretService = new SecretService(),
    snippetService: SnippetService = new SnippetService(),
    keymapService: KeymapService = new KeymapService()
  ) {
    this.logger = logger;
    this.secretService = secretService;
    this.snippetService = snippetService;
    this.keymapService = keymapService;
  }

  public async connect(connection: SshConnection): Promise<number> {
    const { command, args } = buildSshCommand(connection);
    const password = connection.passwordSecretRef
      ? await this.secretService.getPassword(connection.passwordSecretRef)
      : undefined;
    let passwordSent = false;
    let outputBuffer = '';
    const snippets = await this.snippetService.list();
    const keymap = await this.keymapService.get();

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
        let pendingPrefix: string | undefined;
        let picker: SessionSnippetPicker | undefined;
        let pendingRemoteOutput = '';

        const resize = (): void => {
          shell.resize(process.stdout.columns || 80, process.stdout.rows || 24);
        };

        const closePicker = (command?: string, execute = false): void => {
          picker = undefined;
          process.stdout.write('\x1B[?25h\x1B[?1049l');
          if (pendingRemoteOutput) {
            process.stdout.write(pendingRemoteOutput);
            pendingRemoteOutput = '';
          }
          if (command !== undefined) shell.write(`${command}${execute ? '\r' : ''}`);
        };

        const renderPicker = (): void => {
          if (picker) process.stdout.write(picker.render(process.stdout.columns || 80));
        };

        const openPicker = (): SessionSnippetPicker => {
          picker = new SessionSnippetPicker(snippets);
          process.stdout.write('\x1B[?1049h');
          renderPicker();
          return picker;
        };

        const onInput = (data: Buffer): void => {
          const input = normalizeNativeTerminalInput(data.toString());
          if (picker) {
            const action = picker.handleInput(input);
            if (action.close) {
              closePicker(action.command, action.execute ?? false);
            } else {
              renderPicker();
            }
            return;
          }

          const routed = routeSessionInput(input, pendingPrefix, keymap.snippetPicker);
          pendingPrefix = routed.pendingPrefix;
          if (routed.remoteData) shell.write(routed.remoteData);
          if (routed.openSnippets) {
            const activePicker = openPicker();
            if (routed.remainder) {
              activePicker.handleInput(routed.remainder);
              renderPicker();
            }
          }
        };

        const cleanup = (): void => {
          process.stdout.off('resize', resize);
          process.stdin.off('data', onInput);
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          if (picker) closePicker();
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
          if (picker) {
            pendingRemoteOutput = `${pendingRemoteOutput}${data}`.slice(-100_000);
          } else {
            process.stdout.write(data);
          }

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
