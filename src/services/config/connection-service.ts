import type {
  ConnectionInput,
  ConnectionListOptions,
  ConnectionPatch,
  SshConnection
} from '../../types/connection.js';
import { AppError } from '../../utils/app-error.js';
import { createId } from '../../utils/id.js';
import { SecretService } from '../ssh/secret-service.js';
import { ConfigService } from './config-service.js';

const maxRecentConnections = 20;

export class ConnectionService {
  private readonly configService: ConfigService;
  private readonly secretService: SecretService;

  public constructor(
    configService: ConfigService = new ConfigService(),
    secretService: SecretService = new SecretService()
  ) {
    this.configService = configService;
    this.secretService = secretService;
  }

  public async list(options: ConnectionListOptions = {}): Promise<SshConnection[]> {
    const config = await this.configService.load();
    const search = options.search?.trim().toLowerCase();
    const tags = options.tags ?? [];

    const filtered = config.connections.filter((connection) => {
      const matchesSearch =
        !search ||
        [
          connection.name,
          connection.host,
          connection.username,
          connection.group,
          ...connection.tags
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(search));

      const matchesGroup = !options.group || connection.group === options.group;
      const matchesTags = tags.every((tag) => connection.tags.includes(tag));

      return matchesSearch && matchesGroup && matchesTags;
    });

    return this.sortConnections(filtered, options.sortBy ?? 'favorite');
  }

  public async groups(): Promise<string[]> {
    const config = await this.configService.load();
    return [
      ...new Set(
        config.connections
          .map((connection) => connection.group)
          .filter((group): group is string => Boolean(group))
      )
    ].sort();
  }

  public async add(input: ConnectionInput): Promise<SshConnection> {
    const config = await this.configService.load();

    if (config.connections.some((connection) => connection.name === input.name)) {
      throw new AppError('CONNECTION_DUPLICATE', `Connection "${input.name}" already exists`);
    }

    const now = new Date().toISOString();
    const id = createId();
    const passwordSecretRef = input.password
      ? await this.secretService.savePassword(id, input.password)
      : undefined;
    const connection: SshConnection = {
      id,
      name: input.name,
      host: input.host,
      port: input.port ?? 22,
      username: input.username,
      ...(input.identityFile ? { identityFile: input.identityFile } : {}),
      ...(passwordSecretRef ? { passwordSecretRef } : {}),
      ...(input.group ? { group: input.group } : {}),
      tags: input.tags ?? [],
      ...(input.color ? { color: input.color } : {}),
      favorite: input.favorite ?? false,
      createdAt: now,
      updatedAt: now
    };

    await this.configService.save({
      ...config,
      connections: [...config.connections, connection]
    });

    return connection;
  }

  public async update(id: string, patch: ConnectionPatch): Promise<SshConnection> {
    const config = await this.configService.load();
    const index = this.findIndex(config.connections, id);
    const current = this.getConnectionAt(config.connections, index);

    const updated: SshConnection = this.applyPatch(current, patch);

    if (patch.password !== undefined) {
      updated.passwordSecretRef = await this.secretService.savePassword(current.id, patch.password);
    }

    config.connections[index] = updated;
    await this.configService.save(config);

    return updated;
  }

  public async rename(id: string, name: string): Promise<SshConnection> {
    return this.update(id, { name });
  }

  public async delete(id: string): Promise<void> {
    const config = await this.configService.load();
    const index = this.findIndex(config.connections, id);

    const [deleted] = config.connections.splice(index, 1);
    config.recentConnectionIds = config.recentConnectionIds.filter(
      (connectionId) => connectionId !== id
    );

    await this.configService.save(config);
    await this.secretService.deletePassword(deleted?.passwordSecretRef);
  }

  public async duplicate(id: string): Promise<SshConnection> {
    const config = await this.configService.load();
    const index = this.findIndex(config.connections, id);
    const source = this.getConnectionAt(config.connections, index);
    const now = new Date().toISOString();
    const { lastConnectedAt: _lastConnectedAt, ...sourceWithoutRecent } = source;

    const duplicate: SshConnection = {
      ...sourceWithoutRecent,
      id: createId(),
      name: `${source.name} Copy`,
      favorite: false,
      createdAt: now,
      updatedAt: now
    };

    await this.configService.save({
      ...config,
      connections: [...config.connections, duplicate]
    });

    return duplicate;
  }

  public async toggleFavorite(id: string): Promise<SshConnection> {
    const config = await this.configService.load();
    const index = this.findIndex(config.connections, id);
    const current = this.getConnectionAt(config.connections, index);

    return this.update(id, { favorite: !current.favorite });
  }

  public async markRecent(id: string): Promise<void> {
    const config = await this.configService.load();
    const index = this.findIndex(config.connections, id);
    const now = new Date().toISOString();
    const current = this.getConnectionAt(config.connections, index);

    config.connections[index] = {
      ...current,
      lastConnectedAt: now,
      updatedAt: now
    };
    config.recentConnectionIds = [
      id,
      ...config.recentConnectionIds.filter((connectionId) => connectionId !== id)
    ].slice(0, maxRecentConnections);

    await this.configService.save(config);
  }

  public async getRecent(): Promise<SshConnection[]> {
    const config = await this.configService.load();
    const byId = new Map(config.connections.map((connection) => [connection.id, connection]));

    return config.recentConnectionIds
      .map((id) => byId.get(id))
      .filter((connection): connection is SshConnection => Boolean(connection));
  }

  private findIndex(connections: SshConnection[], id: string): number {
    const index = connections.findIndex((connection) => connection.id === id);

    if (index === -1) {
      throw new AppError('CONNECTION_NOT_FOUND', `Connection "${id}" was not found`);
    }

    return index;
  }

  private getConnectionAt(connections: SshConnection[], index: number): SshConnection {
    const connection = connections[index];

    if (!connection) {
      throw new AppError('CONNECTION_NOT_FOUND', 'Connection was not found');
    }

    return connection;
  }

  private applyPatch(current: SshConnection, patch: ConnectionPatch): SshConnection {
    const updated: SshConnection = {
      ...current,
      updatedAt: new Date().toISOString()
    };

    if (patch.name !== undefined) updated.name = patch.name;
    if (patch.host !== undefined) updated.host = patch.host;
    if (patch.port !== undefined) updated.port = patch.port;
    if (patch.username !== undefined) updated.username = patch.username;
    if (patch.identityFile !== undefined) updated.identityFile = patch.identityFile;
    if (patch.group !== undefined) updated.group = patch.group;
    if (patch.tags !== undefined) updated.tags = patch.tags;
    if (patch.color !== undefined) updated.color = patch.color;
    if (patch.favorite !== undefined) updated.favorite = patch.favorite;

    return updated;
  }

  private sortConnections(
    connections: SshConnection[],
    sortBy: ConnectionListOptions['sortBy']
  ): SshConnection[] {
    const sorted = [...connections];

    sorted.sort((left, right) => {
      if (sortBy === 'recent') {
        return (right.lastConnectedAt ?? '').localeCompare(left.lastConnectedAt ?? '');
      }

      if (sortBy === 'group') {
        return `${left.group ?? ''}${left.name}`.localeCompare(`${right.group ?? ''}${right.name}`);
      }

      if (sortBy === 'favorite') {
        const favoriteDelta = Number(right.favorite) - Number(left.favorite);
        return favoriteDelta === 0 ? left.name.localeCompare(right.name) : favoriteDelta;
      }

      return left.name.localeCompare(right.name);
    });

    return sorted;
  }
}
