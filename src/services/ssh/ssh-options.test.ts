import { describe, expect, it } from 'vitest';
import {
  formatSshOptions,
  parseSshOption,
  parseSshOptions,
  parseSshOptionsText
} from './ssh-options.js';

describe('SSH options', () => {
  it('parses repeatable and comma-separated options', () => {
    expect(parseSshOptions(['ServerAliveInterval=30', 'StrictHostKeyChecking=accept-new'])).toEqual(
      {
        ServerAliveInterval: '30',
        StrictHostKeyChecking: 'accept-new'
      }
    );
    expect(parseSshOptionsText('ForwardAgent=yes, ConnectTimeout=10')).toEqual({
      ForwardAgent: 'yes',
      ConnectTimeout: '10'
    });
  });

  it('allows equals signs in values and replaces names case-insensitively', () => {
    expect(parseSshOptions(['ProxyCommand=ssh -W %h:%p jump', 'proxycommand=none'])).toEqual({
      proxycommand: 'none'
    });
    expect(parseSshOption('SetEnv=TOKEN=a=b')).toEqual(['SetEnv', 'TOKEN=a=b']);
  });

  it('rejects malformed options', () => {
    expect(() => parseSshOption('not-an-option')).toThrow('Use Key=Value');
    expect(() => parseSshOption('Bad-Name=value')).toThrow('Use Key=Value');
    expect(() => parseSshOption('ConnectTimeout=')).toThrow('Use Key=Value');
  });

  it('formats options for editing', () => {
    expect(formatSshOptions({ ForwardAgent: 'yes', ConnectTimeout: '10' })).toBe(
      'ForwardAgent=yes, ConnectTimeout=10'
    );
  });
});
