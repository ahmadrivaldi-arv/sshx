import { spawn } from 'node:child_process';
import type { ConnectionHealthStatus, SshConnection } from '../../types/connection.js';
import { ConnectionService } from '../config/connection-service.js';

export interface HealthProbeResult {
  exitCode: number | null;
  stderr: string;
  timedOut?: boolean;
}

export type HealthProbe = (
  connection: SshConnection,
  timeoutMs: number
) => Promise<HealthProbeResult>;

export interface ConnectionHealthResult {
  connection: SshConnection;
  status: ConnectionHealthStatus;
  checkedAt: string;
}

const defaultProbe: HealthProbe = (connection, timeoutMs) =>
  new Promise((resolve) => {
    const args = [
      '-o',
      'BatchMode=yes',
      '-o',
      `ConnectTimeout=${Math.max(1, Math.ceil(timeoutMs / 1000))}`,
      '-o',
      'ConnectionAttempts=1',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'UserKnownHostsFile=/dev/null',
      '-p',
      String(connection.port)
    ];

    if (connection.identityFile) {
      args.push('-i', connection.identityFile);
    }

    args.push(`${connection.username}@${connection.host}`, 'exit');
    const child = spawn('ssh', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs + 1000);

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ exitCode: null, stderr: error.message, timedOut });
    });
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, stderr, timedOut });
    });
  });

export const classifyHealthResult = ({
  exitCode,
  stderr,
  timedOut
}: HealthProbeResult): ConnectionHealthStatus => {
  if (exitCode === 0) {
    return 'online';
  }

  const message = stderr.toLowerCase();
  if (timedOut || message.includes('timed out') || message.includes('operation timeout')) {
    return 'timeout';
  }
  if (
    message.includes('permission denied') ||
    message.includes('authentication failed') ||
    message.includes('no supported authentication methods')
  ) {
    return 'auth-required';
  }
  if (
    message.includes('connection refused') ||
    message.includes('no route to host') ||
    message.includes('could not resolve hostname') ||
    message.includes('name or service not known') ||
    message.includes('network is unreachable')
  ) {
    return 'unreachable';
  }

  return exitCode === null ? 'unreachable' : 'auth-required';
};

export class ConnectionHealthService {
  private readonly connectionService: ConnectionService;
  private readonly probe: HealthProbe;

  public constructor(
    connectionService: ConnectionService = new ConnectionService(),
    probe: HealthProbe = defaultProbe
  ) {
    this.connectionService = connectionService;
    this.probe = probe;
  }

  public async check(connection: SshConnection, timeoutMs = 5000): Promise<ConnectionHealthResult> {
    const probeResult = await this.probe(connection, timeoutMs);
    const status = classifyHealthResult(probeResult);
    const checkedAt = new Date().toISOString();
    const updated = await this.connectionService.recordHealth(connection.id, status, checkedAt);
    return { connection: updated, status, checkedAt };
  }

  public async checkMany(
    connections: SshConnection[],
    timeoutMs = 5000
  ): Promise<ConnectionHealthResult[]> {
    return Promise.all(connections.map((connection) => this.check(connection, timeoutMs)));
  }
}
