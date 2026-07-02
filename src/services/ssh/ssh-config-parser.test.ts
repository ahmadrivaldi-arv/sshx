import { describe, expect, it } from 'vitest';
import { parseSshConfig } from './ssh-config-parser.js';

describe('parseSshConfig', () => {
  it('parses concrete hosts and ignores wildcard hosts', () => {
    const result = parseSshConfig(`
Host *
  User ignored

Host Production
  HostName 1.2.3.4
  User root
  Port 2222
  IdentityFile ~/.ssh/id_ed25519
`);

    expect(result).toEqual([
      {
        name: 'Production',
        host: '1.2.3.4',
        username: 'root',
        port: 2222,
        identityFile: '~/.ssh/id_ed25519',
        tags: ['imported'],
        group: 'Imported'
      }
    ]);
  });
});
