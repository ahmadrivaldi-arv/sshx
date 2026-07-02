import fs from 'fs-extra';
import path from 'node:path';
import YAML from 'yaml';
import type { ConnectionInput, SshConnection } from '../../types/connection.js';
import { AppError } from '../../utils/app-error.js';
import { expandHome } from '../../utils/paths.js';
import { ConnectionService } from '../config/connection-service.js';
import { appConfigSchema } from '../config/schema.js';
import type { ExportFormat } from './export-service.js';
import { parseSshConfig } from './ssh-config-parser.js';

export type ImportFormat = 'ssh-config' | ExportFormat;

export class ImportService {
  private readonly connectionService: ConnectionService;

  public constructor(connectionService: ConnectionService = new ConnectionService()) {
    this.connectionService = connectionService;
  }

  public async importSshConfig(filePath = '~/.ssh/config'): Promise<SshConnection[]> {
    try {
      const content = await fs.readFile(expandHome(filePath), 'utf8');
      const inputs = parseSshConfig(content);
      return this.addImportedConnections(inputs);
    } catch (error) {
      throw new AppError('IMPORT_FAILED', `Failed to import ${filePath}`, error);
    }
  }

  public async importFile(
    filePath = '~/.ssh/config',
    format?: ImportFormat
  ): Promise<SshConnection[]> {
    const resolvedFormat = format ?? this.inferFormat(filePath);

    if (resolvedFormat === 'ssh-config') {
      return this.importSshConfig(filePath);
    }

    try {
      const content = await fs.readFile(expandHome(filePath), 'utf8');
      const data = resolvedFormat === 'json' ? JSON.parse(content) : YAML.parse(content);
      const parsed = appConfigSchema.pick({ connections: true }).parse(data);
      const inputs = parsed.connections.map((connection): ConnectionInput => ({
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        ...(connection.identityFile ? { identityFile: connection.identityFile } : {}),
        ...(connection.group ? { group: connection.group } : {}),
        tags: connection.tags,
        ...(connection.color ? { color: connection.color } : {}),
        favorite: connection.favorite
      }));

      return this.addImportedConnections(inputs);
    } catch (error) {
      throw new AppError('IMPORT_FAILED', `Failed to import ${filePath}`, error);
    }
  }

  private inferFormat(filePath: string): ImportFormat {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.json') {
      return 'json';
    }

    if (extension === '.yaml' || extension === '.yml') {
      return 'yaml';
    }

    return 'ssh-config';
  }

  private async addImportedConnections(inputs: ConnectionInput[]): Promise<SshConnection[]> {
    const imported: SshConnection[] = [];
    const existing = await this.connectionService.list();
    const existingNames = new Set(existing.map((connection) => connection.name));

    for (const input of inputs) {
      if (!existingNames.has(input.name)) {
        imported.push(await this.connectionService.add(input));
      }
    }

    return imported;
  }
}
