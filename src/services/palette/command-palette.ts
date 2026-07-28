export const paletteCommandNames = [
  'add',
  'edit',
  'delete',
  'import',
  'export',
  'logs',
  'theme',
  'snippet',
  'help',
  'about'
] as const;

export type PaletteCommandName = (typeof paletteCommandNames)[number];
export type ExternalPaletteCommand = Extract<
  PaletteCommandName,
  'import' | 'export' | 'logs' | 'theme'
>;

export interface PaletteCommand {
  name: PaletteCommandName;
  description: string;
  usage: string;
  group: 'Connections' | 'Workspace' | 'Appearance' | 'Support';
  shortcut?: string;
}

export const paletteCommands: PaletteCommand[] = [
  {
    name: 'add',
    description: 'Add a connection',
    usage: ':add',
    group: 'Connections',
    shortcut: 'a'
  },
  {
    name: 'edit',
    description: 'Edit the selected connection',
    usage: ':edit',
    group: 'Connections',
    shortcut: 'e'
  },
  {
    name: 'delete',
    description: 'Delete selected connections',
    usage: ':delete',
    group: 'Connections',
    shortcut: 'd'
  },
  {
    name: 'import',
    description: 'Preview or apply an import',
    usage: ':import [file] [--apply] [--strategy=skip|overwrite|rename]',
    group: 'Connections'
  },
  {
    name: 'export',
    description: 'Export connections',
    usage: ':export <file>',
    group: 'Connections'
  },
  {
    name: 'snippet',
    description: 'Search command snippets',
    usage: ':snippet <query>',
    group: 'Workspace',
    shortcut: 's'
  },
  {
    name: 'theme',
    description: 'Browse themes or apply one by name',
    usage: ':theme [name]',
    group: 'Appearance',
    shortcut: 'T'
  },
  {
    name: 'help',
    description: 'Show contextual keyboard help',
    usage: ':help',
    group: 'Support',
    shortcut: '?'
  },
  {
    name: 'about',
    description: 'Show version and project links',
    usage: ':about',
    group: 'Support'
  },
  {
    name: 'logs',
    description: 'Show the log file path',
    usage: ':logs',
    group: 'Support'
  }
];

export const fuzzyScore = (query: string, candidate: string): number | undefined => {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCandidate = candidate.toLowerCase();
  if (!normalizedQuery) return 0;

  let queryIndex = 0;
  let score = 0;
  let lastMatch = -2;

  for (let index = 0; index < normalizedCandidate.length; index += 1) {
    if (normalizedCandidate[index] !== normalizedQuery[queryIndex]) continue;
    score += index === lastMatch + 1 ? 4 : 1;
    if (index === queryIndex) score += 2;
    lastMatch = index;
    queryIndex += 1;
    if (queryIndex === normalizedQuery.length) {
      return score - normalizedCandidate.length * 0.01;
    }
  }

  return undefined;
};

export const matchPaletteCommands = (
  query: string,
  recent: readonly PaletteCommandName[] = []
): PaletteCommand[] => {
  const commandQuery = query.trim().split(/\s+/, 1)[0] ?? '';
  return paletteCommands
    .map((command) => ({ command, score: fuzzyScore(commandQuery, command.name) }))
    .filter(
      (match): match is { command: PaletteCommand; score: number } => match.score !== undefined
    )
    .sort((left, right) => {
      if (!commandQuery) {
        const leftRecent = recent.indexOf(left.command.name);
        const rightRecent = recent.indexOf(right.command.name);
        if (leftRecent >= 0 || rightRecent >= 0) {
          if (leftRecent < 0) return 1;
          if (rightRecent < 0) return -1;
          return leftRecent - rightRecent;
        }
      }
      return right.score - left.score;
    })
    .map(({ command }) => command);
};

export const parsePaletteInput = (
  input: string
): { command?: PaletteCommandName; args: string[] } => {
  const [rawCommand, ...args] = input.trim().split(/\s+/).filter(Boolean);
  const command = paletteCommandNames.find((name) => name === rawCommand?.toLowerCase());
  return { ...(command ? { command } : {}), args };
};
