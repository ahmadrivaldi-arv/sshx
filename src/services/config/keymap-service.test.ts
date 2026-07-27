import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from './config-service.js';
import { defaultKeymap, KeymapService } from './keymap-service.js';

let tempDir: string | undefined;

const createService = async (): Promise<KeymapService> => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-keymap-'));
  return new KeymapService(
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

describe('KeymapService', () => {
  it('persists picker and manager shortcuts', async () => {
    const service = await createService();
    await expect(service.get()).resolves.toEqual(defaultKeymap);
    await service.setSnippetPicker(['ctrl-]-s', 'f2', 'f2']);
    await service.setSnippetManager('n');
    await expect(service.get()).resolves.toEqual({
      snippetPicker: ['ctrl-]-s', 'f2'],
      snippetManager: 'n'
    });
  });

  it('rejects unsupported and conflicting shortcuts', async () => {
    const service = await createService();
    await expect(service.setSnippetPicker(['ctrl-x-s'])).rejects.toThrow('Unsupported');
    await expect(service.setSnippetManager('a')).rejects.toThrow('conflicts');
    await expect(service.setSnippetManager('F2')).rejects.toThrow('one lowercase letter');
  });

  it('resets custom keymaps', async () => {
    const service = await createService();
    await service.setSnippetManager('n');
    await expect(service.reset()).resolves.toEqual(defaultKeymap);
  });
});
