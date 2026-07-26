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
  lastConnectedAt: z.string().datetime().optional()
});

export const appConfigSchema = z.object({
  connections: z.array(sshConnectionSchema).default([]),
  recentConnectionIds: z.array(z.string().uuid()).default([])
});

export type AppConfigData = z.infer<typeof appConfigSchema>;
