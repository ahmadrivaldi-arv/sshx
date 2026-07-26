import { describe, expect, it } from 'vitest';
import type { SshConnection } from '../../types/connection.js';
import { buildSshCommand } from './ssh-command.js';

const createConnection = (overrides: Partial<SshConnection> = {}): SshConnection => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Production',
  host: 'example.com',
  port: 2222,
  username: 'deploy',
  tags: [],
  favorite: false,
  sshOptions: {},
  suppressWeakCryptoWarning: false,
  createdAt: '2026-07-02T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
  ...overrides
});

describe('buildSshCommand', () => {
  it('places options before the SSH destination', () => {
    const result = buildSshCommand(
      createConnection({
        identityFile: '/keys/deploy',
        sshOptions: {
          ServerAliveInterval: '30',
          StrictHostKeyChecking: 'accept-new'
        }
      })
    );

    expect(result.args).toEqual([
      '-p',
      '2222',
      '-i',
      '/keys/deploy',
      '-o',
      'ServerAliveInterval=30',
      '-o',
      'StrictHostKeyChecking=accept-new',
      'deploy@example.com'
    ]);
  });

  it('suppresses weak crypto warnings with a dedicated option', () => {
    const result = buildSshCommand(
      createConnection({
        suppressWeakCryptoWarning: true,
        sshOptions: { WarnWeakCrypto: 'yes', ConnectTimeout: '10' }
      })
    );

    expect(result.args).toEqual([
      '-p',
      '2222',
      '-o',
      'WarnWeakCrypto=no',
      '-o',
      'ConnectTimeout=10',
      'deploy@example.com'
    ]);
  });
});
