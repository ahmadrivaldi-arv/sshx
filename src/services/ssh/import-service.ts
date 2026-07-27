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
export type DuplicateStrategy = 'skip' | 'overwrite' | 'rename';
export type ImportAction = 'add' | DuplicateStrategy;

export interface ImportPreviewItem {
  input: ConnectionInput;
  action: ImportAction;
  duplicateName?: string;
}

export interface ImportPreview {
  items: ImportPreviewItem[];
  add: number;
  skip: number;
  overwrite: number;
  rename: number;
}

export class ImportService {
  private readonly connectionService: ConnectionService;

  public constructor(connectionService: ConnectionService = new ConnectionService()) {
    this.connectionService = connectionService;
  }

  public async importSshConfig(
    filePath = '~/.ssh/config',
    strategy: DuplicateStrategy = 'skip'
  ): Promise<SshConnection[]> {
    const preview = await this.previewFile(filePath, 'ssh-config', strategy);
    return this.applyPreview(preview);
  }

  public async importFile(
    filePath = '~/.ssh/config',
    format?: ImportFormat,
    strategy: DuplicateStrategy = 'skip'
  ): Promise<SshConnection[]> {
    const preview = await this.previewFile(filePath, format, strategy);
    return this.applyPreview(preview);
  }

  public async previewFile(
    filePath = '~/.ssh/config',
    format?: ImportFormat,
    strategy: DuplicateStrategy = 'skip'
  ): Promise<ImportPreview> {
    const resolvedFormat = format ?? this.inferFormat(filePath);

    try {
      const content = await fs.readFile(expandHome(filePath), 'utf8');
      const inputs =
        resolvedFormat === 'ssh-config'
          ? parseSshConfig(content)
          : this.parseExport(content, resolvedFormat);
      return this.createPreview(inputs, strategy);
    } catch (error) {
      throw new AppError('IMPORT_FAILED', `Failed to import ${filePath}`, error);
    }
  }

  public async applyPreview(preview: ImportPreview): Promise<SshConnection[]> {
    const imported: SshConnection[] = [];

    for (const item of preview.items) {
      if (item.action === 'skip') {
        continue;
      }

      if (item.action === 'overwrite') {
        const duplicate = await this.connectionService.findDuplicate(item.input);
        if (duplicate) {
          imported.push(await this.connectionService.update(duplicate.id, item.input));
          continue;
        }
      }

      imported.push(
        await this.connectionService.add(item.input, {
          allowEndpointDuplicate: item.action === 'rename'
        })
      );
    }

    return imported;
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

  private parseExport(content: string, format: ExportFormat): ConnectionInput[] {
    const data = format === 'json' ? JSON.parse(content) : YAML.parse(content);
    const parsed = appConfigSchema.pick({ connections: true }).parse(data);
    return parsed.connections.map((connection): ConnectionInput => ({
      name: connection.name,
      host: connection.host,
      port: connection.port,
      username: connection.username,
      ...(connection.identityFile ? { identityFile: connection.identityFile } : {}),
      ...(connection.group ? { group: connection.group } : {}),
      tags: connection.tags,
      ...(connection.color ? { color: connection.color } : {}),
      favorite: connection.favorite,
      sshOptions: connection.sshOptions,
      suppressWeakCryptoWarning: connection.suppressWeakCryptoWarning
    }));
  }

  private async createPreview(
    inputs: ConnectionInput[],
    strategy: DuplicateStrategy
  ): Promise<ImportPreview> {
    const existing = await this.connectionService.list();
    const known = existing.map((connection) => ({
      name: connection.name,
      host: connection.host,
      port: connection.port,
      username: connection.username
    }));
    const items: ImportPreviewItem[] = [];

    for (const input of inputs) {
      const duplicate = known.find(
        (connection) =>
          connection.name.toLowerCase() === input.name.trim().toLowerCase() ||
          (connection.host.toLowerCase() === input.host.trim().toLowerCase() &&
            connection.username.toLowerCase() === input.username.trim().toLowerCase() &&
            connection.port === (input.port ?? 22))
      );

      if (!duplicate) {
        const normalized = { ...input, name: input.name.trim() };
        items.push({ input: normalized, action: 'add' });
        known.push({
          name: normalized.name,
          host: normalized.host,
          port: normalized.port ?? 22,
          username: normalized.username
        });
        continue;
      }

      if (strategy === 'rename') {
        const renamed = {
          ...input,
          name: this.uniqueName(
            input.name,
            known.map(({ name }) => name)
          )
        };
        items.push({ input: renamed, action: 'rename', duplicateName: duplicate.name });
        known.push({
          name: renamed.name,
          host: renamed.host,
          port: renamed.port ?? 22,
          username: renamed.username
        });
        continue;
      }

      items.push({ input, action: strategy, duplicateName: duplicate.name });
    }

    return {
      items,
      add: items.filter(({ action }) => action === 'add').length,
      skip: items.filter(({ action }) => action === 'skip').length,
      overwrite: items.filter(({ action }) => action === 'overwrite').length,
      rename: items.filter(({ action }) => action === 'rename').length
    };
  }

  private uniqueName(name: string, names: string[]): string {
    const existing = new Set(names.map((value) => value.toLowerCase()));
    let number = 2;
    let candidate = `${name} (${number})`;

    while (existing.has(candidate.toLowerCase())) {
      number += 1;
      candidate = `${name} (${number})`;
    }

    return candidate;
  }
}
