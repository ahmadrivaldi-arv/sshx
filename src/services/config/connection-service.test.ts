import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from './config-service.js';
import { ConnectionService } from './connection-service.js';

let tempDir: string | undefined;

const createService = async (): Promise<ConnectionService> => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-'));
  const configService = new ConfigService({
    configDir: tempDir,
    configFile: path.join(tempDir, 'config.json')
  });

  return new ConnectionService(configService);
};

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('ConnectionService', () => {
  it('adds and searches connections', async () => {
    const service = await createService();

    await service.add({
      name: 'Production Web',
      host: '1.2.3.4',
      username: 'root',
      group: 'Production',
      tags: ['Ubuntu']
    });

    const results = await service.list({ search: 'prod' });

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Production Web');
  });

  it('keeps favorites above regular connections', async () => {
    const service = await createService();

    await service.add({ name: 'Database', host: '10.0.0.2', username: 'root' });
    await service.add({ name: 'API', host: '10.0.0.1', username: 'root', favorite: true });

    const results = await service.list();

    expect(results.map((connection) => connection.name)).toEqual(['API', 'Database']);
  });

  it('stores SSH options and can clear optional fields while editing', async () => {
    const service = await createService();
    const connection = await service.add({
      name: 'Legacy',
      host: 'legacy.example.com',
      username: 'root',
      identityFile: '~/.ssh/legacy',
      group: 'Old',
      sshOptions: { HostKeyAlgorithms: '+ssh-rsa' },
      suppressWeakCryptoWarning: true
    });

    const updated = await service.update(connection.id, {
      identityFile: null,
      group: null,
      sshOptions: {},
      suppressWeakCryptoWarning: false
    });

    expect(updated.identityFile).toBeUndefined();
    expect(updated.group).toBeUndefined();
    expect(updated.sshOptions).toEqual({});
    expect(updated.suppressWeakCryptoWarning).toBe(false);
  });

  it('uses unique names for repeated duplicates', async () => {
    const service = await createService();
    const connection = await service.add({
      name: 'Production',
      host: 'prod.example.com',
      username: 'deploy'
    });

    const first = await service.duplicate(connection.id);
    const second = await service.duplicate(connection.id);

    expect(first.name).toBe('Production Copy');
    expect(second.name).toBe('Production Copy 2');
  });

  it('rejects case-insensitive duplicate names when adding or editing', async () => {
    const service = await createService();
    const production = await service.add({
      name: 'Production',
      host: 'prod.example.com',
      username: 'deploy'
    });
    const staging = await service.add({
      name: 'Staging',
      host: 'staging.example.com',
      username: 'deploy'
    });

    await expect(
      service.add({ name: 'production', host: 'other.example.com', username: 'root' })
    ).rejects.toThrow('already exists');
    await expect(service.update(staging.id, { name: production.name })).rejects.toThrow(
      'already exists'
    );
  });
});
