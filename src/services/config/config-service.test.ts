import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from './config-service.js';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('ConfigService', () => {
  it('adds v0.4 defaults when loading an older connection', async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-config-'));
    const configFile = path.join(tempDir, 'config.json');

    await writeFile(
      configFile,
      JSON.stringify({
        connections: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'Existing',
            host: 'existing.example.com',
            port: 22,
            username: 'deploy',
            tags: [],
            favorite: false,
            createdAt: '2026-07-02T00:00:00.000Z',
            updatedAt: '2026-07-02T00:00:00.000Z'
          }
        ],
        recentConnectionIds: []
      }),
      'utf8'
    );

    const service = new ConfigService({ configDir: tempDir, configFile });
    const config = await service.load();

    expect(config.connections[0]?.sshOptions).toEqual({});
    expect(config.connections[0]?.suppressWeakCryptoWarning).toBe(false);
    expect(config.theme).toEqual({
      name: 'default',
      compact: false,
      ascii: false
    });
  });
});
