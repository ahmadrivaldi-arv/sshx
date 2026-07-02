import fs from 'fs-extra';
import type { ConnectionInput, SshConnection } from '../../types/connection.js';
import { AppError } from '../../utils/app-error.js';
import { expandHome } from '../../utils/paths.js';
import { ConnectionService } from '../config/connection-service.js';
import { parseSshConfig } from './ssh-config-parser.js';

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
