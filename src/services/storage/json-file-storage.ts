import fs from 'fs-extra';
import path from 'node:path';
import { AppError } from '../../utils/app-error.js';

export class JsonFileStorage<T> {
  private readonly filePath: string;
  private readonly defaultValue: T;

  public constructor(filePath: string, defaultValue: T) {
    this.filePath = filePath;
    this.defaultValue = defaultValue;
  }

  public async read(): Promise<T> {
    try {
      const exists = await fs.pathExists(this.filePath);

      if (!exists) {
        await this.write(this.defaultValue);
        return this.defaultValue;
      }

      const content = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(content) as T;
    } catch (error) {
      throw new AppError('CONFIG_READ_FAILED', `Failed to read ${this.filePath}`, error);
    }
  }

  public async write(value: T): Promise<void> {
    try {
      await fs.ensureDir(this.getDirectory());
      await fs.writeJson(this.filePath, value, { spaces: 2 });
    } catch (error) {
      throw new AppError('CONFIG_WRITE_FAILED', `Failed to write ${this.filePath}`, error);
    }
  }

  private getDirectory(): string {
    return path.dirname(this.filePath);
  }
}
