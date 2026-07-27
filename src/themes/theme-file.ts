import { z } from 'zod';
import type { CustomThemeFile, ThemeDefinition } from '../types/theme.js';

const customColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Theme colors must use #RRGGBB format');

export const customThemeFileSchema = z.object({
  name: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{0,63}$/,
      'Theme name must contain lowercase letters, numbers, and hyphens'
    ),
  label: z.string().min(1).max(80),
  description: z.string().min(1).max(200),
  colors: z.object({
    accent: customColorSchema,
    muted: customColorSchema,
    border: customColorSchema,
    text: customColorSchema,
    favorite: customColorSchema,
    warning: customColorSchema,
    danger: customColorSchema
  }),
  decorated: z.boolean().default(true),
  useConnectionColors: z.boolean().default(false)
});

export const parseCustomThemeFile = (data: unknown): CustomThemeFile =>
  customThemeFileSchema.parse(data);

export const customThemeFileToDefinition = (theme: CustomThemeFile): ThemeDefinition => ({
  name: theme.name,
  label: theme.label,
  description: theme.description,
  accent: theme.colors.accent,
  muted: theme.colors.muted,
  border: theme.colors.border,
  text: theme.colors.text,
  favorite: theme.colors.favorite,
  warning: theme.colors.warning,
  danger: theme.colors.danger,
  decorated: theme.decorated,
  useConnectionColors: theme.useConnectionColors,
  source: 'custom'
});
