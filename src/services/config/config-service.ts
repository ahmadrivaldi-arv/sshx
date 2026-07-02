import { ZodError } from 'zod';
import type { AppConfig, ConfigPaths } from '../../types/config.js';
import { AppError } from '../../utils/app-error.js';
import { createDefaultConfigPaths } from '../../utils/paths.js';
import { JsonFileStorage } from '../storage/json-file-storage.js';
import { appConfigSchema } from './schema.js';

const defaultConfig: AppConfig = {
  connections: [],
  recentConnectionIds: []
};

export class ConfigService {
  private readonly storage: JsonFileStorage<unknown>;

  public constructor(paths: ConfigPaths = createDefaultConfigPaths()) {
    this.storage = new JsonFileStorage<unknown>(paths.configFile, defaultConfig);
  }

  public async load(): Promise<AppConfig> {
    try {
      const data = await this.storage.read();
      return appConfigSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          'CONFIG_INVALID',
          error.issues.map((issue) => issue.message).join(', '),
          error
        );
      }

      throw error;
    }
  }

  public async save(config: AppConfig): Promise<void> {
    const parsed = appConfigSchema.parse(config);
    await this.storage.write(parsed);
  }
}
