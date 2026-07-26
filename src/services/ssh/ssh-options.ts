import type { SshOptions } from '../../types/connection.js';

const optionNamePattern = /^[A-Za-z][A-Za-z0-9]*$/;

export const parseSshOption = (value: string): [string, string] => {
  const separatorIndex = value.indexOf('=');
  const name = value.slice(0, separatorIndex).trim();
  const optionValue = value.slice(separatorIndex + 1).trim();

  if (separatorIndex < 1 || !optionNamePattern.test(name) || !optionValue) {
    throw new Error(`Invalid SSH option "${value}". Use Key=Value.`);
  }

  return [name, optionValue];
};

export const parseSshOptions = (values: string[]): SshOptions => {
  const options: SshOptions = {};

  for (const value of values) {
    const [name, optionValue] = parseSshOption(value);
    const existingName = Object.keys(options).find(
      (candidate) => candidate.toLowerCase() === name.toLowerCase()
    );

    if (existingName) {
      delete options[existingName];
    }

    options[name] = optionValue;
  }

  return options;
};

export const parseSshOptionsText = (value: string): SshOptions =>
  parseSshOptions(
    value
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean)
  );

export const formatSshOptions = (options: SshOptions): string =>
  Object.entries(options)
    .map(([name, value]) => `${name}=${value}`)
    .join(', ');
