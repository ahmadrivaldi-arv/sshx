import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { AppError } from '../../utils/app-error.js';
import { createDefaultConfigPaths } from '../../utils/paths.js';

const execFileAsync = promisify(execFile);
const serviceName = 'sshx';

type SecretBackend = 'keychain' | 'libsecret' | 'dpapi';

export class SecretService {
  public async savePassword(connectionId: string, password: string): Promise<string> {
    const backend = this.getBackend();

    if (backend === 'keychain') {
      await this.saveMacOsPassword(connectionId, password);
    } else if (backend === 'libsecret') {
      await this.saveLinuxPassword(connectionId, password);
    } else {
      await this.saveWindowsPassword(connectionId, password);
    }

    return this.createPasswordRef(backend, connectionId);
  }

  public async getPassword(secretRef: string): Promise<string | undefined> {
    try {
      const { backend, connectionId } = this.parsePasswordRef(secretRef);

      if (backend === 'keychain') {
        return await this.getMacOsPassword(connectionId);
      }

      if (backend === 'libsecret') {
        return await this.getLinuxPassword(connectionId);
      }

      return await this.getWindowsPassword(connectionId);
    } catch {
      return undefined;
    }
  }

  public async deletePassword(secretRef: string | undefined): Promise<void> {
    if (!secretRef) {
      return;
    }

    try {
      const { backend, connectionId } = this.parsePasswordRef(secretRef);

      if (backend === 'keychain') {
        await execFileAsync('security', [
          'delete-generic-password',
          '-a',
          connectionId,
          '-s',
          serviceName
        ]);
      } else if (backend === 'libsecret') {
        await execFileAsync('secret-tool', [
          'clear',
          'application',
          serviceName,
          'account',
          connectionId
        ]);
      } else {
        await fs.rm(this.getWindowsSecretPath(connectionId), { force: true });
      }
    } catch {
      // Missing secrets should not block deleting a connection.
    }
  }

  private async saveMacOsPassword(connectionId: string, password: string): Promise<void> {
    try {
      await execFileAsync('security', [
        'add-generic-password',
        '-a',
        connectionId,
        '-s',
        serviceName,
        '-w',
        password,
        '-U'
      ]);
    } catch (error) {
      throw new AppError('SECRET_FAILED', 'Failed to save password to macOS Keychain', error);
    }
  }

  private async getMacOsPassword(connectionId: string): Promise<string | undefined> {
    const { stdout } = await execFileAsync('security', [
      'find-generic-password',
      '-a',
      connectionId,
      '-s',
      serviceName,
      '-w'
    ]);

    return stdout.trimEnd();
  }

  private async saveLinuxPassword(connectionId: string, password: string): Promise<void> {
    try {
      await this.spawnWithInput(
        'secret-tool',
        [
          'store',
          '--label',
          `Sshx ${connectionId}`,
          'application',
          serviceName,
          'account',
          connectionId
        ],
        password
      );
    } catch (error) {
      throw new AppError(
        'SECRET_FAILED',
        'Failed to save password with libsecret. Install secret-tool/libsecret and ensure a Secret Service is running.',
        error
      );
    }
  }

  private async getLinuxPassword(connectionId: string): Promise<string | undefined> {
    const { stdout } = await execFileAsync('secret-tool', [
      'lookup',
      'application',
      serviceName,
      'account',
      connectionId
    ]);

    return stdout.trimEnd();
  }

  private async saveWindowsPassword(connectionId: string, password: string): Promise<void> {
    try {
      const script =
        "$ErrorActionPreference='Stop';" +
        '$secure=ConvertTo-SecureString $env:SSH_MANAGER_SECRET -AsPlainText -Force;' +
        '$secure | ConvertFrom-SecureString';
      const { stdout } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        {
          env: { ...process.env, SSH_MANAGER_SECRET: password }
        }
      );
      const secretPath = this.getWindowsSecretPath(connectionId);

      await fs.mkdir(path.dirname(secretPath), { recursive: true });
      await fs.writeFile(secretPath, stdout.trimEnd(), 'utf8');
    } catch (error) {
      throw new AppError('SECRET_FAILED', 'Failed to save password with Windows DPAPI', error);
    }
  }

  private async getWindowsPassword(connectionId: string): Promise<string | undefined> {
    const secretPath = this.getWindowsSecretPath(connectionId);
    const encrypted = await fs.readFile(secretPath, 'utf8');
    const script =
      "$ErrorActionPreference='Stop';" +
      '$secure=ConvertTo-SecureString $env:SSH_MANAGER_SECRET_BLOB;' +
      '$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure);' +
      'try {[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)} ' +
      'finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}';
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      {
        env: { ...process.env, SSH_MANAGER_SECRET_BLOB: encrypted.trim() }
      }
    );

    return stdout.trimEnd();
  }

  private getWindowsSecretPath(connectionId: string): string {
    return path.join(createDefaultConfigPaths().configDir, 'secrets', `${connectionId}.dpapi`);
  }

  private getBackend(): SecretBackend {
    if (process.platform === 'darwin') {
      return 'keychain';
    }

    if (process.platform === 'linux') {
      return 'libsecret';
    }

    if (process.platform === 'win32') {
      return 'dpapi';
    }

    throw new AppError(
      'SECRET_FAILED',
      `Unsupported platform for secure password storage: ${process.platform}`
    );
  }

  private createPasswordRef(backend: SecretBackend, connectionId: string): string {
    return `${backend}://${serviceName}/${connectionId}`;
  }

  private parsePasswordRef(secretRef: string): { backend: SecretBackend; connectionId: string } {
    for (const backend of ['keychain', 'libsecret', 'dpapi'] satisfies SecretBackend[]) {
      const prefix = `${backend}://${serviceName}/`;

      if (secretRef.startsWith(prefix)) {
        return { backend, connectionId: secretRef.slice(prefix.length) };
      }
    }

    throw new AppError('SECRET_FAILED', 'Unsupported password secret reference');
  }

  private async spawnWithInput(command: string, args: string[], input: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'pipe'] });
      const stderr: Buffer[] = [];

      child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(Buffer.concat(stderr).toString('utf8') || `${command} exited with ${code}`)
        );
      });
      child.stdin.end(input);
    });
  }
}
