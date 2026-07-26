import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from '../config/config-service.js';
import { ConnectionService } from '../config/connection-service.js';
import { ImportService } from './import-service.js';

let tempDir: string | undefined;
let connectionService: ConnectionService | undefined;

const createService = async (): Promise<ImportService> => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-import-'));
  const configService = new ConfigService({
    configDir: tempDir,
    configFile: path.join(tempDir, 'config.json')
  });

  connectionService = new ConnectionService(configService);
  return new ImportService(connectionService);
};

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
    connectionService = undefined;
  }
});

describe('ImportService', () => {
  it('imports connections from Sshx JSON export format', async () => {
    const service = await createService();
    const filePath = path.join(tempDir as string, 'connections.json');

    await writeFile(
      filePath,
      JSON.stringify({
        connections: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'Imported JSON',
            host: '10.0.0.1',
            port: 22,
            username: 'root',
            tags: ['json'],
            favorite: true,
            sshOptions: {
              ServerAliveInterval: '30'
            },
            suppressWeakCryptoWarning: true,
            createdAt: '2026-07-02T00:00:00.000Z',
            updatedAt: '2026-07-02T00:00:00.000Z'
          }
        ]
      }),
      'utf8'
    );

    const imported = await service.importFile(filePath);

    expect(imported).toHaveLength(1);
    expect(imported[0]?.name).toBe('Imported JSON');
    expect(imported[0]?.favorite).toBe(true);
    expect(imported[0]?.sshOptions).toEqual({ ServerAliveInterval: '30' });
    expect(imported[0]?.suppressWeakCryptoWarning).toBe(true);
  });

  it('previews duplicate strategies before applying changes', async () => {
    const service = await createService();
    const existing = await connectionService?.add({
      name: 'Production',
      host: 'prod.example.com',
      username: 'deploy',
      tags: ['old']
    });
    const filePath = path.join(tempDir as string, 'duplicates.json');
    const exportedConnection = {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Production',
      host: 'new.example.com',
      port: 22,
      username: 'root',
      tags: ['new'],
      favorite: false,
      sshOptions: {},
      suppressWeakCryptoWarning: false,
      createdAt: '2026-07-02T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z'
    };
    await writeFile(filePath, JSON.stringify({ connections: [exportedConnection] }), 'utf8');

    const skip = await service.previewFile(filePath, 'json', 'skip');
    const rename = await service.previewFile(filePath, 'json', 'rename');
    const overwrite = await service.previewFile(filePath, 'json', 'overwrite');

    expect(skip).toMatchObject({ add: 0, skip: 1, overwrite: 0, rename: 0 });
    expect(rename.items[0]).toMatchObject({ action: 'rename', input: { name: 'Production (2)' } });
    expect(overwrite).toMatchObject({ add: 0, skip: 0, overwrite: 1, rename: 0 });

    await service.applyPreview(overwrite);
    expect(await connectionService?.list()).toEqual([
      expect.objectContaining({
        id: existing?.id,
        host: 'new.example.com',
        tags: ['new']
      })
    ]);
  });
});
