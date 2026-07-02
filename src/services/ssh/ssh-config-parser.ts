import type { ConnectionInput } from '../../types/connection.js';

interface ParsedHost {
  alias: string;
  hostName?: string;
  user?: string;
  port?: number;
  identityFile?: string;
}

const ignoredHostPatterns = new Set(['*']);

export const parseSshConfig = (content: string): ConnectionInput[] => {
  const hosts: ParsedHost[] = [];
  let current: ParsedHost | undefined;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const [keywordRaw, ...valueParts] = line.split(/\s+/);
    const keyword = keywordRaw?.toLowerCase();
    const value = valueParts.join(' ');

    if (!keyword || !value) {
      continue;
    }

    if (keyword === 'host') {
      const alias = value.split(/\s+/)[0];

      if (alias && !ignoredHostPatterns.has(alias) && !alias.includes('*')) {
        current = { alias };
        hosts.push(current);
      } else {
        current = undefined;
      }

      continue;
    }

    if (!current) {
      continue;
    }

    if (keyword === 'hostname') {
      current.hostName = value;
    } else if (keyword === 'user') {
      current.user = value;
    } else if (keyword === 'port') {
      const port = Number(value);

      if (Number.isInteger(port)) {
        current.port = port;
      }
    } else if (keyword === 'identityfile') {
      current.identityFile = value;
    }
  }

  return hosts
    .filter((host) => host.hostName && host.user)
    .map((host) => ({
      name: host.alias,
      host: host.hostName as string,
      username: host.user as string,
      port: host.port ?? 22,
      ...(host.identityFile ? { identityFile: host.identityFile } : {}),
      tags: ['imported'],
      group: 'Imported'
    }));
};
