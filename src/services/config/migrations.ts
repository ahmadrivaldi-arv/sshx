import { AppError } from '../../utils/app-error.js';

export const currentConfigVersion = 2 as const;

export interface ConfigMigrationResult {
  data: unknown;
  migrated: boolean;
}

export const migrateConfigData = (data: unknown): ConfigMigrationResult => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { data, migrated: false };
  }

  const record = data as Record<string, unknown>;
  const version = record.configVersion;

  if (version === undefined || version === 0 || version === 1) {
    return {
      data: {
        ...record,
        configVersion: currentConfigVersion,
        snippets: Array.isArray(record.snippets) ? record.snippets : []
      },
      migrated: true
    };
  }

  if (typeof version === 'number' && version > currentConfigVersion) {
    throw new AppError(
      'CONFIG_VERSION_UNSUPPORTED',
      `Config version ${version} is newer than supported version ${currentConfigVersion}. Update Sshx before opening this vault.`
    );
  }

  return { data, migrated: false };
};
