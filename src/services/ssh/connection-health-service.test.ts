import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from '../config/config-service.js';
import { ConnectionService } from '../config/connection-service.js';
import { classifyHealthResult, ConnectionHealthService } from './connection-health-service.js';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('ConnectionHealthService', () => {
  it('classifies common SSH probe outcomes', () => {
    expect(classifyHealthResult({ exitCode: 0, stderr: '' })).toBe('online');
    expect(classifyHealthResult({ exitCode: 255, stderr: 'Permission denied (publickey)' })).toBe(
      'auth-required'
    );
    expect(classifyHealthResult({ exitCode: 255, stderr: 'Connection refused' })).toBe(
      'unreachable'
    );
    expect(classifyHealthResult({ exitCode: null, stderr: '', timedOut: true })).toBe('timeout');
  });

  it('stores the status and check timestamp', async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-health-'));
    const configService = new ConfigService({
      configDir: tempDir,
      configFile: path.join(tempDir, 'config.json')
    });
    const connections = new ConnectionService(configService);
    const connection = await connections.add({
      name: 'Production',
      host: 'prod.example.com',
      username: 'deploy'
    });
    const health = new ConnectionHealthService(connections, async () => ({
      exitCode: 255,
      stderr: 'Permission denied'
    }));

    await expect(health.check(connection, 100)).resolves.toMatchObject({
      status: 'auth-required'
    });
    await expect(connections.list()).resolves.toEqual([
      expect.objectContaining({
        healthStatus: 'auth-required',
        lastCheckedAt: expect.any(String)
      })
    ]);
  });
});
