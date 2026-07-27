import { z } from 'zod';

export const connectionColorSchema = z.enum([
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray'
]);

export const sshOptionsSchema = z.record(
  z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/, 'Invalid SSH option name'),
  z.string().min(1)
);

export const accentColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Accent color must use #RRGGBB format');

export const themeNameSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,63}$/,
    'Theme name must contain lowercase letters, numbers, and hyphens'
  );

export const themeConfigSchema = z.object({
  name: themeNameSchema.default('default'),
  accentColor: accentColorSchema.optional(),
  compact: z.boolean().default(false),
  ascii: z.boolean().default(false)
});

export const sshConnectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1),
  identityFile: z.string().min(1).optional(),
  passwordSecretRef: z.string().min(1).optional(),
  group: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).default([]),
  color: connectionColorSchema.optional(),
  favorite: z.boolean().default(false),
  sshOptions: sshOptionsSchema.default({}),
  suppressWeakCryptoWarning: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastConnectedAt: z.string().datetime().optional(),
  connectionCount: z.number().int().min(0).default(0),
  lastConnectionStatus: z.enum(['success', 'failed']).optional(),
  lastConnectionDurationMs: z.number().int().min(0).optional(),
  healthStatus: z.enum(['online', 'unreachable', 'timeout', 'auth-required']).optional(),
  lastCheckedAt: z.string().datetime().optional()
});

const hasNoTerminalControls = (value: string): boolean =>
  [...value].every((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127;
  });

export const commandSnippetSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1)
    .refine(hasNoTerminalControls, 'Snippet name must not contain terminal control characters'),
  command: z
    .string()
    .min(1)
    .refine(hasNoTerminalControls, 'Snippet command must be a single safe line'),
  description: z
    .string()
    .trim()
    .min(1)
    .refine(
      hasNoTerminalControls,
      'Snippet description must not contain terminal control characters'
    )
    .optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .refine(hasNoTerminalControls, 'Snippet tags must not contain terminal control characters')
    )
    .default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const appConfigSchema = z.object({
  configVersion: z.literal(2),
  connections: z.array(sshConnectionSchema).default([]),
  recentConnectionIds: z.array(z.string().uuid()).default([]),
  snippets: z.array(commandSnippetSchema).default([]),
  theme: themeConfigSchema.default({
    name: 'default',
    compact: false,
    ascii: false
  })
});

export type AppConfigData = z.infer<typeof appConfigSchema>;
