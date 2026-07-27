import { ZodError } from 'zod';
import type { AppConfig, ConfigPaths } from '../../types/config.js';
import { AppError } from '../../utils/app-error.js';
import { createDefaultConfigPaths } from '../../utils/paths.js';
import { JsonFileStorage } from '../storage/json-file-storage.js';
import { currentConfigVersion, migrateConfigData } from './migrations.js';
import { appConfigSchema } from './schema.js';

const defaultConfig: AppConfig = {
  configVersion: currentConfigVersion,
  connections: [],
  recentConnectionIds: [],
  snippets: [],
  keymap: {
    snippetPicker: ['f2', 'ctrl-b-s'],
    snippetManager: 's'
  },
  theme: {
    name: 'default',
    compact: false,
    ascii: false
  }
};

export class ConfigService {
  private readonly storage: JsonFileStorage<unknown>;
  private readonly paths: ConfigPaths;

  public constructor(paths: ConfigPaths = createDefaultConfigPaths()) {
    this.paths = paths;
    this.storage = new JsonFileStorage<unknown>(paths.configFile, defaultConfig);
  }

  public getPaths(): ConfigPaths {
    return this.paths;
  }

  public async load(): Promise<AppConfig> {
    try {
      const data = await this.storage.read();
      const migration = migrateConfigData(data);
      const parsed = appConfigSchema.parse(migration.data);
      if (migration.migrated) {
        await this.storage.write(parsed);
      }
      return parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          'CONFIG_INVALID',
          `Invalid configuration: ${error.issues
            .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
            .join('; ')}`,
          error
        );
      }

      throw error;
    }
  }

  public async save(config: AppConfig): Promise<void> {
    try {
      const parsed = appConfigSchema.parse(config);
      await this.storage.write(parsed);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          'CONFIG_INVALID',
          `Invalid configuration: ${error.issues
            .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
            .join('; ')}`,
          error
        );
      }
      throw error;
    }
  }
}
