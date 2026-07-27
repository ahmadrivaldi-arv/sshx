import fs from 'fs-extra';
import path from 'node:path';
import { ZodError } from 'zod';
import type {
  CustomThemeFile,
  ResolvedTheme,
  ThemeConfig,
  ThemeConfigPatch,
  ThemeDefinition
} from '../../types/theme.js';
import { AppError } from '../../utils/app-error.js';
import { expandHome } from '../../utils/paths.js';
import { customThemeFileToDefinition, parseCustomThemeFile } from '../../themes/theme-file.js';
import { builtInThemes, resolveTheme } from '../../themes/themes.js';
import { ConfigService } from './config-service.js';

export class ThemeService {
  private readonly configService: ConfigService;
  private readonly themesDir: string;

  public constructor(configService: ConfigService = new ConfigService(), themesDir?: string) {
    this.configService = configService;
    this.themesDir = themesDir ?? path.join(configService.getPaths().configDir, 'themes');
  }

  public getThemesDir(): string {
    return this.themesDir;
  }

  public async ensureThemesDir(): Promise<string> {
    await fs.ensureDir(this.themesDir);
    return this.themesDir;
  }

  public async list(): Promise<ThemeDefinition[]> {
    const customThemes = await this.loadCustomThemes();
    return [
      ...builtInThemes,
      ...customThemes.sort((left, right) => left.name.localeCompare(right.name))
    ];
  }

  public async getDefinition(name: string): Promise<ThemeDefinition> {
    const builtIn = builtInThemes.find((theme) => theme.name === name);

    if (builtIn) return builtIn;

    const filePath = this.getCustomThemePath(name);

    if (!(await fs.pathExists(filePath))) {
      throw new AppError(
        'THEME_NOT_FOUND',
        `Theme "${name}" was not found. Run "sshx theme list" to see installed themes.`
      );
    }

    return this.readCustomTheme(filePath, name);
  }

  public async getConfig(): Promise<ThemeConfig> {
    return (await this.configService.load()).theme;
  }

  public async getResolved(): Promise<ResolvedTheme> {
    const config = await this.getConfig();
    return resolveTheme(config, await this.getDefinition(config.name));
  }

  public async update(patch: ThemeConfigPatch): Promise<ResolvedTheme> {
    const config = await this.configService.load();
    const theme: ThemeConfig = {
      ...config.theme,
      ...(patch.name ? { name: patch.name } : {}),
      ...(patch.compact !== undefined ? { compact: patch.compact } : {}),
      ...(patch.ascii !== undefined ? { ascii: patch.ascii } : {})
    };

    if (patch.accentColor === null) {
      delete theme.accentColor;
    } else if (patch.accentColor !== undefined) {
      theme.accentColor = patch.accentColor;
    }

    const definition = await this.getDefinition(theme.name);
    await this.configService.save({ ...config, theme });

    return resolveTheme(theme, definition);
  }

  public async install(
    sourcePath: string,
    options: { force?: boolean } = {}
  ): Promise<ThemeDefinition> {
    const customTheme = await this.readCustomThemeFile(expandHome(sourcePath));

    if (builtInThemes.some((theme) => theme.name === customTheme.name)) {
      throw new AppError(
        'THEME_RESERVED',
        `Theme name "${customTheme.name}" is reserved by a built-in theme`
      );
    }

    const targetPath = this.getCustomThemePath(customTheme.name);

    if (!options.force && (await fs.pathExists(targetPath))) {
      throw new AppError(
        'THEME_EXISTS',
        `Theme "${customTheme.name}" is already installed. Use --force to replace it.`
      );
    }

    await fs.ensureDir(this.themesDir);
    await fs.writeJson(targetPath, customTheme, { spaces: 2 });

    return customThemeFileToDefinition(customTheme);
  }

  private getCustomThemePath(name: string): string {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(name)) {
      throw new AppError(
        'THEME_INVALID',
        'Theme name must contain lowercase letters, numbers, and hyphens'
      );
    }

    return path.join(this.themesDir, `${name}.json`);
  }

  private async loadCustomThemes(): Promise<ThemeDefinition[]> {
    if (!(await fs.pathExists(this.themesDir))) return [];

    const entries = await fs.readdir(this.themesDir);
    const themes: ThemeDefinition[] = [];

    for (const entry of entries.filter((name) => name.endsWith('.json')).sort()) {
      const expectedName = path.basename(entry, '.json');
      const theme = await this.readCustomTheme(path.join(this.themesDir, entry), expectedName);

      if (builtInThemes.some((builtIn) => builtIn.name === theme.name)) {
        throw new AppError(
          'THEME_RESERVED',
          `Custom theme "${entry}" uses reserved name "${theme.name}"`
        );
      }

      themes.push(theme);
    }

    return themes;
  }

  private async readCustomTheme(filePath: string, expectedName: string): Promise<ThemeDefinition> {
    const theme = await this.readCustomThemeFile(filePath);

    if (theme.name !== expectedName) {
      throw new AppError(
        'THEME_INVALID',
        `Theme file "${path.basename(filePath)}" must declare name "${expectedName}"`
      );
    }

    return customThemeFileToDefinition(theme);
  }

  private async readCustomThemeFile(filePath: string): Promise<CustomThemeFile> {
    try {
      return parseCustomThemeFile(await fs.readJson(filePath));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          'THEME_INVALID',
          `Invalid theme file "${filePath}": ${error.issues
            .map((issue) => issue.message)
            .join(', ')}`,
          error
        );
      }

      if (error instanceof AppError) throw error;

      throw new AppError('THEME_READ_FAILED', `Failed to read theme file "${filePath}"`, error);
    }
  }
}
