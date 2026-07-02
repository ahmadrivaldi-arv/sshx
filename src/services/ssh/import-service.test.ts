import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from '../config/config-service.js';
import { ConnectionService } from '../config/connection-service.js';
import { ImportService } from './import-service.js';

let tempDir: string | undefined;

const createService = async (): Promise<ImportService> => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-import-'));
  const configService = new ConfigService({
    configDir: tempDir,
    configFile: path.join(tempDir, 'config.json')
  });

  return new ImportService(new ConnectionService(configService));
};

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
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
  });
});
