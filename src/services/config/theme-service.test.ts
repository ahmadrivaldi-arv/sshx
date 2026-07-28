import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigService } from './config-service.js';
import { ThemeService } from './theme-service.js';

let tempDir: string | undefined;

const customTheme = {
  name: 'ocean',
  label: 'Ocean',
  description: 'A shareable blue custom theme',
  colors: {
    accent: '#00aaff',
    muted: '#557788',
    border: '#224466',
    text: '#e6f7ff',
    favorite: '#ffee88',
    warning: '#ffaa44',
    danger: '#ff5566'
  },
  decorated: true,
  useConnectionColors: false
};

const createServices = async (): Promise<{
  configService: ConfigService;
  themeService: ThemeService;
}> => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'sshx-theme-'));
  const configService = new ConfigService({
    configDir: tempDir,
    configFile: path.join(tempDir, 'config.json')
  });

  return {
    configService,
    themeService: new ThemeService(configService, undefined, { noColor: false })
  };
};

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('ThemeService', () => {
  it('loads default theme preferences for a new config', async () => {
    const { themeService } = await createServices();

    await expect(themeService.getConfig()).resolves.toEqual({
      name: 'default',
      compact: false,
      ascii: false
    });
  });

  it('persists theme, accent, compact, and ASCII preferences', async () => {
    const { configService, themeService } = await createServices();

    const resolved = await themeService.update({
      name: 'catppuccin',
      accentColor: '#abcdef',
      compact: true,
      ascii: true
    });

    expect(resolved).toMatchObject({
      name: 'catppuccin',
      accent: '#abcdef',
      compact: true,
      ascii: true
    });
    await expect(configService.load()).resolves.toMatchObject({
      theme: {
        name: 'catppuccin',
        accentColor: '#abcdef',
        compact: true,
        ascii: true
      }
    });
  });

  it('can clear a custom accent while preserving other preferences', async () => {
    const { themeService } = await createServices();

    await themeService.update({
      name: 'nord',
      accentColor: '#123456',
      compact: true
    });
    const resolved = await themeService.update({ accentColor: null, ascii: true });

    expect(resolved.accent).toBe('#88c0d0');
    expect(resolved.configuredAccent).toBeUndefined();
    expect(resolved.compact).toBe(true);
    expect(resolved.ascii).toBe(true);
  });

  it('rejects invalid accent colors', async () => {
    const { themeService } = await createServices();

    await expect(themeService.update({ accentColor: 'orange' })).rejects.toThrow(
      'Accent color must use #RRGGBB format'
    );
  });

  it('installs, discovers, and activates an external theme', async () => {
    const { themeService } = await createServices();
    const sourcePath = path.join(tempDir as string, 'downloaded-theme.json');

    await writeFile(sourcePath, JSON.stringify(customTheme), 'utf8');

    const installed = await themeService.install(sourcePath);
    const themes = await themeService.list();
    const resolved = await themeService.update({ name: 'ocean' });

    expect(installed).toMatchObject({ name: 'ocean', source: 'custom' });
    expect(themes.map((theme) => theme.name)).toContain('ocean');
    expect(resolved).toMatchObject({
      name: 'ocean',
      source: 'custom',
      accent: '#00aaff'
    });
    expect(
      JSON.parse(await readFile(path.join(themeService.getThemesDir(), 'ocean.json'), 'utf8'))
    ).toEqual(customTheme);
  });

  it('discovers themes copied directly into the custom theme directory', async () => {
    const { themeService } = await createServices();

    await mkdir(themeService.getThemesDir(), { recursive: true });
    await writeFile(
      path.join(themeService.getThemesDir(), 'ocean.json'),
      JSON.stringify(customTheme),
      'utf8'
    );

    await expect(themeService.getDefinition('ocean')).resolves.toMatchObject({
      label: 'Ocean',
      source: 'custom'
    });
  });

  it('rejects invalid files, reserved names, and accidental replacement', async () => {
    const { themeService } = await createServices();
    const sourcePath = path.join(tempDir as string, 'theme.json');

    await writeFile(
      sourcePath,
      JSON.stringify({ ...customTheme, colors: { accent: 'blue' } }),
      'utf8'
    );
    await expect(themeService.install(sourcePath)).rejects.toThrow(
      'Theme colors must use #RRGGBB format'
    );

    await writeFile(sourcePath, JSON.stringify({ ...customTheme, name: 'dracula' }), 'utf8');
    await expect(themeService.install(sourcePath)).rejects.toThrow('reserved');

    await writeFile(sourcePath, JSON.stringify(customTheme), 'utf8');
    await themeService.install(sourcePath);
    await expect(themeService.install(sourcePath)).rejects.toThrow('already installed');
    await expect(themeService.install(sourcePath, { force: true })).resolves.toMatchObject({
      name: 'ocean'
    });
  });
});
