import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from './config-service.js';
import { SnippetService } from './snippet-service.js';

let tempDir: string | undefined;

const createService = async (): Promise<SnippetService> => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-snippets-'));
  return new SnippetService(
    new ConfigService({
      configDir: tempDir,
      configFile: path.join(tempDir, 'config.json')
    })
  );
};

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('SnippetService', () => {
  it('creates, searches, updates, and deletes snippets', async () => {
    const service = await createService();
    const snippet = await service.add({
      name: 'Docker logs',
      command: 'docker logs -f {{container}}',
      description: 'Follow a container',
      tags: ['docker', 'logs', 'docker']
    });

    await expect(service.list({ search: 'dlog' })).resolves.toEqual([
      expect.objectContaining({ id: snippet.id, tags: ['docker', 'logs'] })
    ]);
    await expect(service.list({ tags: ['DOCKER'] })).resolves.toHaveLength(1);

    const updated = await service.update('Docker logs', {
      name: 'Container logs',
      description: null,
      command: 'docker logs {{container}}'
    });
    expect(updated).toMatchObject({
      id: snippet.id,
      name: 'Container logs',
      command: 'docker logs {{container}}'
    });
    expect(updated.description).toBeUndefined();

    await expect(service.delete(updated.id)).resolves.toMatchObject({ id: snippet.id });
    await expect(service.list()).resolves.toEqual([]);
  });

  it('rejects duplicate names case-insensitively', async () => {
    const service = await createService();
    await service.add({ name: 'Deploy', command: './deploy.sh' });
    await expect(service.add({ name: 'deploy', command: 'make deploy' })).rejects.toThrow(
      'already exists'
    );
  });

  it('rejects commands containing terminal control characters', async () => {
    const service = await createService();
    await expect(
      service.add({ name: 'Unsafe', command: 'echo safe\nrm -rf target' })
    ).rejects.toThrow('single safe line');
    await expect(service.list()).resolves.toEqual([]);
  });
});
