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
    const name = input.name.trim();

    if (
      config.connections.some((connection) => connection.name.toLowerCase() === name.toLowerCase())
    ) {
      throw new AppError('CONNECTION_DUPLICATE', `Connection "${name}" already exists`);
    }

    const now = new Date().toISOString();
    const id = createId();
    const passwordSecretRef = input.password
      ? await this.secretService.savePassword(id, input.password)
      : undefined;
    const connection: SshConnection = {
      id,
      name,
      host: input.host.trim(),
      port: input.port ?? 22,
      username: input.username.trim(),
      ...(input.identityFile ? { identityFile: input.identityFile } : {}),
      ...(passwordSecretRef ? { passwordSecretRef } : {}),
      ...(input.group ? { group: input.group } : {}),
      tags: input.tags ?? [],
      ...(input.color ? { color: input.color } : {}),
      favorite: input.favorite ?? false,
      sshOptions: input.sshOptions ?? {},
      suppressWeakCryptoWarning: input.suppressWeakCryptoWarning ?? false,
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

    if (
      config.connections.some(
        (connection) =>
          connection.id !== id && connection.name.toLowerCase() === updated.name.toLowerCase()
      )
    ) {
      throw new AppError('CONNECTION_DUPLICATE', `Connection "${updated.name}" already exists`);
    }

    if (patch.password !== undefined) {
      if (patch.password) {
        updated.passwordSecretRef = await this.secretService.savePassword(
          current.id,
          patch.password
        );
      } else {
        await this.secretService.deletePassword(current.passwordSecretRef);
        delete updated.passwordSecretRef;
      }
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
    const {
      lastConnectedAt: _lastConnectedAt,
      passwordSecretRef: _passwordSecretRef,
      ...sourceWithoutRecent
    } = source;
    const existingNames = new Set(
      config.connections.map((connection) => connection.name.toLowerCase())
    );
    let copyNumber = 1;
    let duplicateName = `${source.name} Copy`;

    while (existingNames.has(duplicateName.toLowerCase())) {
      copyNumber += 1;
      duplicateName = `${source.name} Copy ${copyNumber}`;
    }

    const duplicateId = createId();
    const password = source.passwordSecretRef
      ? await this.secretService.getPassword(source.passwordSecretRef)
      : undefined;
    const passwordSecretRef = password
      ? await this.secretService.savePassword(duplicateId, password)
      : undefined;

    const duplicate: SshConnection = {
      ...sourceWithoutRecent,
      id: duplicateId,
      name: duplicateName,
      ...(passwordSecretRef ? { passwordSecretRef } : {}),
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

    if (patch.name !== undefined) updated.name = patch.name.trim();
    if (patch.host !== undefined) updated.host = patch.host.trim();
    if (patch.port !== undefined) updated.port = patch.port;
    if (patch.username !== undefined) updated.username = patch.username.trim();
    if (patch.identityFile !== undefined) {
      if (patch.identityFile) updated.identityFile = patch.identityFile.trim();
      else delete updated.identityFile;
    }
    if (patch.group !== undefined) {
      if (patch.group) updated.group = patch.group.trim();
      else delete updated.group;
    }
    if (patch.tags !== undefined) updated.tags = patch.tags;
    if (patch.color !== undefined) {
      if (patch.color) updated.color = patch.color;
      else delete updated.color;
    }
    if (patch.favorite !== undefined) updated.favorite = patch.favorite;
    if (patch.sshOptions !== undefined) updated.sshOptions = patch.sshOptions;
    if (patch.suppressWeakCryptoWarning !== undefined) {
      updated.suppressWeakCryptoWarning = patch.suppressWeakCryptoWarning;
    }

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
