import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createConfigPaths, expandHome } from './paths.js';

describe('config paths', () => {
  it('uses XDG_CONFIG_HOME on Linux', () => {
    expect(
      createConfigPaths({
        platform: 'linux',
        homeDirectory: '/home/dev',
        environment: { XDG_CONFIG_HOME: '/var/config/dev' }
      })
    ).toEqual({
      configDir: '/var/config/dev/sshx',
      configFile: '/var/config/dev/sshx/config.json'
    });
  });

  it('uses LOCALAPPDATA and Windows separators on Windows', () => {
    expect(
      createConfigPaths({
        platform: 'win32',
        homeDirectory: 'C:\\Users\\dev',
        environment: { LOCALAPPDATA: 'D:\\LocalData' }
      })
    ).toEqual({
      configDir: 'D:\\LocalData\\sshx',
      configFile: 'D:\\LocalData\\sshx\\config.json'
    });
  });

  it('uses the home config directory on macOS and expands both tilde styles', () => {
    expect(
      createConfigPaths({
        platform: 'darwin',
        homeDirectory: '/Users/dev'
      }).configFile
    ).toBe('/Users/dev/.config/sshx/config.json');
    expect(expandHome('~/keys/id_ed25519', '/Users/dev')).toBe(
      path.join('/Users/dev', 'keys/id_ed25519')
    );
    expect(expandHome('~\\keys', '/Users/dev')).toBe(path.join('/Users/dev', 'keys'));
  });
});
