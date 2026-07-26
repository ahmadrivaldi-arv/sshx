export type ConnectionColor =
  'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';

export type SshOptions = Record<string, string>;

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
  sshOptions: SshOptions;
  suppressWeakCryptoWarning: boolean;
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
  sshOptions?: SshOptions | undefined;
  suppressWeakCryptoWarning?: boolean | undefined;
}

export interface ConnectionPatch extends Partial<
  Omit<ConnectionInput, 'color' | 'group' | 'identityFile' | 'password'>
> {
  color?: ConnectionColor | null | undefined;
  group?: string | null | undefined;
  identityFile?: string | null | undefined;
  password?: string | null | undefined;
}

export type ConnectionSortKey = 'name' | 'group' | 'recent' | 'favorite';

export interface ConnectionListOptions {
  search?: string;
  group?: string;
  tags?: string[];
  sortBy?: ConnectionSortKey;
}
