export type ConnectionColor =
  'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';

export interface SshConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  identityFile?: string | undefined;
  passwordSecretRef?: string | undefined;
  group?: string | undefined;
  tags: string[];
  color?: ConnectionColor | undefined;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastConnectedAt?: string | undefined;
}

export interface ConnectionInput {
  name: string;
  host: string;
  port?: number;
  username: string;
  identityFile?: string | undefined;
  password?: string | undefined;
  group?: string | undefined;
  tags?: string[];
  color?: ConnectionColor | undefined;
  favorite?: boolean | undefined;
}

export type ConnectionPatch = Partial<ConnectionInput>;

export type ConnectionSortKey = 'name' | 'group' | 'recent' | 'favorite';

export interface ConnectionListOptions {
  search?: string;
  group?: string;
  tags?: string[];
  sortBy?: ConnectionSortKey;
}
