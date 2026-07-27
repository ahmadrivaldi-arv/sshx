import type { KeymapConfig, SnippetPickerBinding } from '../../types/keymap.js';
import { snippetPickerBindings } from '../../types/keymap.js';
import { ConfigService } from './config-service.js';

export const reservedSnippetManagerKeys = new Set([
  'a',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'j',
  'k',
  'q',
  'r',
  't'
]);

export const defaultKeymap: KeymapConfig = {
  snippetPicker: ['f2', 'ctrl-b-s'],
  snippetManager: 's'
};

export class KeymapService {
  public constructor(private readonly configService: ConfigService = new ConfigService()) {}

  public async get(): Promise<KeymapConfig> {
    return (await this.configService.load()).keymap;
  }

  public async setSnippetPicker(bindings: string[]): Promise<KeymapConfig> {
    const normalized = [...new Set(bindings.map((binding) => binding.trim().toLowerCase()))];
    if (normalized.length === 0) {
      throw new Error('Configure at least one snippet picker shortcut');
    }
    for (const binding of normalized) {
      if (!snippetPickerBindings.includes(binding as SnippetPickerBinding)) {
        throw new Error(
          `Unsupported snippet picker shortcut "${binding}". Use ${snippetPickerBindings.join(', ')}`
        );
      }
    }
    return this.update({
      snippetPicker: normalized as SnippetPickerBinding[]
    });
  }

  public async setSnippetManager(key: string): Promise<KeymapConfig> {
    const normalized = key.trim().toLowerCase();
    if (!/^[a-z]$/.test(normalized)) {
      throw new Error('Snippet manager shortcut must be one lowercase letter');
    }
    if (reservedSnippetManagerKeys.has(normalized)) {
      throw new Error(`Shortcut "${normalized}" conflicts with a connection browser action`);
    }
    return this.update({ snippetManager: normalized });
  }

  public async reset(): Promise<KeymapConfig> {
    const config = await this.configService.load();
    await this.configService.save({ ...config, keymap: defaultKeymap });
    return defaultKeymap;
  }

  private async update(patch: Partial<KeymapConfig>): Promise<KeymapConfig> {
    const config = await this.configService.load();
    const keymap = { ...config.keymap, ...patch };
    await this.configService.save({ ...config, keymap });
    return keymap;
  }
}
