import fs from 'fs-extra';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import type { SshConnection } from '../../types/connection.js';
import type { CommandSnippet } from '../../types/snippet.js';
import { AppError } from '../../utils/app-error.js';
import { createId } from '../../utils/id.js';
import { expandHome } from '../../utils/paths.js';
import { ConfigService } from '../config/config-service.js';
import { migrateConfigData } from '../config/migrations.js';
import { appConfigSchema } from '../config/schema.js';
import { SecretService } from '../ssh/secret-service.js';

export type BackupFormat = 'json' | 'yaml';
export type RestoreStrategy = 'skip' | 'overwrite' | 'rename' | 'replace';

export const backupEnvelopeSchema = z.object({
  backupVersion: z.literal(1),
  createdAt: z.string().datetime(),
  config: appConfigSchema
});

export type BackupEnvelope = z.infer<typeof backupEnvelopeSchema>;

export interface RestoreResult {
  added: number;
  skipped: number;
  overwritten: number;
  renamed: number;
  replaced: number;
}

export class BackupService {
  private readonly configService: ConfigService;
  private readonly secretService: SecretService;

  public constructor(
    configService: ConfigService = new ConfigService(),
    secretService: SecretService = new SecretService()
  ) {
    this.configService = configService;
    this.secretService = secretService;
  }

  public async backup(filePath: string, format?: BackupFormat): Promise<BackupEnvelope> {
    try {
      const config = await this.configService.load();
      const envelope: BackupEnvelope = {
        backupVersion: 1,
        createdAt: new Date().toISOString(),
        config: {
          ...config,
          connections: config.connections.map((connection) =>
            this.withoutSecretReference(connection)
          )
        }
      };
      const resolvedFormat = format ?? this.inferFormat(filePath);
      const content =
        resolvedFormat === 'json'
          ? `${JSON.stringify(envelope, null, 2)}\n`
          : YAML.stringify(envelope);
      await fs.outputFile(expandHome(filePath), content, 'utf8');
      return envelope;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('BACKUP_FAILED', `Failed to create backup "${filePath}"`, error);
    }
  }

  public async validate(filePath: string, format?: BackupFormat): Promise<BackupEnvelope> {
    try {
      const resolvedFormat = format ?? this.inferFormat(filePath);
      const content = await fs.readFile(expandHome(filePath), 'utf8');
      const raw = resolvedFormat === 'json' ? JSON.parse(content) : YAML.parse(content);
      const migratedRaw =
        raw && typeof raw === 'object' && !Array.isArray(raw) && 'config' in raw
          ? {
              ...raw,
              config: migrateConfigData((raw as { config: unknown }).config).data
            }
          : raw;
      const parsed = backupEnvelopeSchema.parse(migratedRaw);
      return {
        ...parsed,
        config: {
          ...parsed.config,
          connections: parsed.config.connections.map((connection) =>
            this.withoutSecretReference(connection)
          )
        }
      };
    } catch (error) {
      throw new AppError('BACKUP_INVALID', `Invalid backup "${filePath}"`, error);
    }
  }

  public async restore(
    filePath: string,
    strategy: RestoreStrategy = 'skip',
    format?: BackupFormat
  ): Promise<RestoreResult> {
    const backup = await this.validate(filePath, format);
    const current = await this.configService.load();

    if (strategy === 'replace') {
      await this.configService.save({
        ...backup.config,
        connections: await Promise.all(
          backup.config.connections.map((source) =>
            this.preserveLocalSecretReference(source, current.connections)
          )
        )
      });
      return {
        added: 0,
        skipped: 0,
        overwritten: 0,
        renamed: 0,
        replaced: backup.config.connections.length + backup.config.snippets.length
      };
    }

    const connections = [...current.connections];
    const idMap = new Map<string, string>();
    const result: RestoreResult = {
      added: 0,
      skipped: 0,
      overwritten: 0,
      renamed: 0,
      replaced: 0
    };

    for (const source of backup.config.connections) {
      const duplicateIndex = connections.findIndex((connection) =>
        this.isDuplicate(connection, source)
      );
      const duplicate = connections[duplicateIndex];

      if (duplicate && strategy === 'skip') {
        idMap.set(source.id, duplicate.id);
        result.skipped += 1;
        continue;
      }

      if (duplicate && strategy === 'overwrite') {
        const restored = {
          ...source,
          id: duplicate.id,
          ...(duplicate.passwordSecretRef ? { passwordSecretRef: duplicate.passwordSecretRef } : {})
        };
        connections[duplicateIndex] = restored;
        idMap.set(source.id, restored.id);
        result.overwritten += 1;
        continue;
      }

      const id = connections.some((connection) => connection.id === source.id)
        ? createId()
        : source.id;
      const name =
        duplicate && strategy === 'rename'
          ? this.uniqueName(
              source.name,
              connections.map((connection) => connection.name)
            )
          : source.name;
      const restored = { ...source, id, name };
      connections.push(restored);
      idMap.set(source.id, restored.id);
      if (duplicate) result.renamed += 1;
      else result.added += 1;
    }

    const snippets = [...current.snippets];
    for (const source of backup.config.snippets) {
      const duplicateIndex = snippets.findIndex((snippet) =>
        this.isSnippetDuplicate(snippet, source)
      );
      const duplicate = snippets[duplicateIndex];

      if (duplicate && strategy === 'skip') {
        result.skipped += 1;
        continue;
      }

      if (duplicate && strategy === 'overwrite') {
        snippets[duplicateIndex] = { ...source, id: duplicate.id };
        result.overwritten += 1;
        continue;
      }

      const id = snippets.some((snippet) => snippet.id === source.id) ? createId() : source.id;
      const name =
        duplicate && strategy === 'rename'
          ? this.uniqueName(
              source.name,
              snippets.map((snippet) => snippet.name)
            )
          : source.name;
      snippets.push({ ...source, id, name });
      if (duplicate) result.renamed += 1;
      else result.added += 1;
    }

    const restoredRecentIds = backup.config.recentConnectionIds
      .map((id) => idMap.get(id))
      .filter((id): id is string => Boolean(id));
    await this.configService.save({
      configVersion: current.configVersion,
      connections,
      recentConnectionIds: [
        ...new Set([...restoredRecentIds, ...current.recentConnectionIds])
      ].filter((id) => connections.some((connection) => connection.id === id)),
      snippets,
      keymap: backup.config.keymap,
      theme: backup.config.theme
    });

    return result;
  }

  private inferFormat(filePath: string): BackupFormat {
    const extension = path.extname(filePath).toLowerCase();
    return extension === '.yaml' || extension === '.yml' ? 'yaml' : 'json';
  }

  private withoutSecretReference(connection: SshConnection): SshConnection {
    const { passwordSecretRef: _passwordSecretRef, ...safe } = connection;
    return safe;
  }

  private async preserveLocalSecretReference(
    source: SshConnection,
    currentConnections: SshConnection[]
  ): Promise<SshConnection> {
    const current =
      currentConnections.find(({ id }) => id === source.id) ??
      currentConnections.find((connection) => this.isSameEndpoint(connection, source));
    const passwordSecretRef =
      current?.passwordSecretRef ??
      (await this.secretService.findPasswordReference(current?.id ?? source.id));

    return passwordSecretRef ? { ...source, passwordSecretRef } : source;
  }

  private isDuplicate(left: SshConnection, right: SshConnection): boolean {
    return left.name.toLowerCase() === right.name.toLowerCase() || this.isSameEndpoint(left, right);
  }

  private isSameEndpoint(left: SshConnection, right: SshConnection): boolean {
    return (
      left.host.toLowerCase() === right.host.toLowerCase() &&
      left.username.toLowerCase() === right.username.toLowerCase() &&
      left.port === right.port
    );
  }

  private isSnippetDuplicate(left: CommandSnippet, right: CommandSnippet): boolean {
    return left.id === right.id || left.name.toLowerCase() === right.name.toLowerCase();
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
