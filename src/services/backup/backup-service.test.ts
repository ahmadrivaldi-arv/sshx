import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from '../config/config-service.js';
import { ConnectionService } from '../config/connection-service.js';
import { SnippetService } from '../config/snippet-service.js';
import { BackupService } from './backup-service.js';

let tempDir: string | undefined;

const createServices = async (): Promise<{
  backup: BackupService;
  config: ConfigService;
  connections: ConnectionService;
  snippets: SnippetService;
}> => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-backup-'));
  const config = new ConfigService({
    configDir: tempDir,
    configFile: path.join(tempDir, 'config.json')
  });
  return {
    backup: new BackupService(config),
    config,
    connections: new ConnectionService(config),
    snippets: new SnippetService(config)
  };
};

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('BackupService', () => {
  it('backs up the full config without password references', async () => {
    const { backup, config, connections, snippets } = await createServices();
    const connection = await connections.add({
      name: 'Production',
      host: 'prod.example.com',
      username: 'deploy'
    });
    const current = await config.load();
    current.connections[0] = { ...connection, passwordSecretRef: 'secret:test' };
    current.theme = { ...current.theme, name: 'dracula' };
    await snippets.add({ name: 'Uptime', command: 'uptime' });
    const withSnippet = await config.load();
    withSnippet.connections = current.connections;
    withSnippet.theme = current.theme;
    await config.save(withSnippet);
    const file = path.join(tempDir as string, 'backup.json');

    await backup.backup(file);
    const parsed = JSON.parse(await readFile(file, 'utf8'));

    expect(parsed).toMatchObject({
      backupVersion: 1,
      config: { theme: { name: 'dracula' }, snippets: [{ name: 'Uptime' }] }
    });
    expect(parsed.config.connections[0].passwordSecretRef).toBeUndefined();
  });

  it('validates backups and applies overwrite and rename conflicts', async () => {
    const { backup, config, connections } = await createServices();
    const current = await connections.add({
      name: 'Production',
      host: 'old.example.com',
      username: 'deploy'
    });
    const sourceConfig = await config.load();
    sourceConfig.connections = [
      {
        ...current,
        id: '00000000-0000-4000-8000-000000000099',
        host: 'new.example.com',
        tags: ['restored']
      }
    ];
    sourceConfig.theme = { ...sourceConfig.theme, name: 'nord' };
    sourceConfig.keymap = {
      snippetPicker: ['ctrl-]-s'],
      snippetManager: 'n'
    };
    const file = path.join(tempDir as string, 'restore.json');
    await writeFile(
      file,
      JSON.stringify({
        backupVersion: 1,
        createdAt: new Date().toISOString(),
        config: sourceConfig
      }),
      'utf8'
    );

    await expect(backup.validate(file)).resolves.toMatchObject({ backupVersion: 1 });
    await expect(backup.restore(file, 'overwrite')).resolves.toMatchObject({
      overwritten: 1
    });
    expect(await connections.list()).toEqual([
      expect.objectContaining({
        id: current.id,
        host: 'new.example.com',
        tags: ['restored']
      })
    ]);
    await expect(config.load()).resolves.toMatchObject({
      keymap: {
        snippetPicker: ['ctrl-]-s'],
        snippetManager: 'n'
      }
    });

    await expect(backup.restore(file, 'rename')).resolves.toMatchObject({ renamed: 1 });
    expect((await connections.list()).map(({ name }) => name)).toEqual([
      'Production',
      'Production (2)'
    ]);
  });

  it('rejects malformed backups before changing config', async () => {
    const { backup } = await createServices();
    const file = path.join(tempDir as string, 'invalid.json');
    await writeFile(file, JSON.stringify({ backupVersion: 999 }), 'utf8');

    await expect(backup.validate(file)).rejects.toThrow('Invalid backup');
  });

  it('restores snippets with overwrite and rename conflict strategies', async () => {
    const { backup, config, snippets } = await createServices();
    const current = await snippets.add({ name: 'Deploy', command: './deploy-old.sh' });
    const sourceConfig = await config.load();
    sourceConfig.snippets = [{ ...current, command: './deploy-new.sh' }];
    const file = path.join(tempDir as string, 'snippet-restore.json');
    await writeFile(
      file,
      JSON.stringify({
        backupVersion: 1,
        createdAt: new Date().toISOString(),
        config: sourceConfig
      }),
      'utf8'
    );

    await expect(backup.restore(file, 'overwrite')).resolves.toMatchObject({
      overwritten: 1
    });
    await expect(snippets.get('Deploy')).resolves.toMatchObject({
      id: current.id,
      command: './deploy-new.sh'
    });

    await expect(backup.restore(file, 'rename')).resolves.toMatchObject({ renamed: 1 });
    await expect(snippets.list()).resolves.toEqual([
      expect.objectContaining({ name: 'Deploy' }),
      expect.objectContaining({ name: 'Deploy (2)' })
    ]);
  });
});
