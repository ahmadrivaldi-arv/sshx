import fs from 'fs-extra';
import YAML from 'yaml';
import { AppError } from '../../utils/app-error.js';
import { ConnectionService } from '../config/connection-service.js';

export type ExportFormat = 'json' | 'yaml';

export class ExportService {
  private readonly connectionService: ConnectionService;

  public constructor(connectionService: ConnectionService = new ConnectionService()) {
    this.connectionService = connectionService;
  }

  public async export(filePath: string, format: ExportFormat): Promise<void> {
    try {
      const connections = await this.connectionService.list({ sortBy: 'group' });
      const content =
        format === 'json'
          ? `${JSON.stringify({ connections }, null, 2)}\n`
          : YAML.stringify({ connections });

      await fs.outputFile(filePath, content, 'utf8');
    } catch (error) {
      throw new AppError('EXPORT_FAILED', `Failed to export connections to ${filePath}`, error);
    }
  }
}
