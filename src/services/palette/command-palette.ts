export const paletteCommandNames = [
  'add',
  'edit',
  'delete',
  'import',
  'export',
  'logs',
  'theme',
  'snippet'
] as const;

export type PaletteCommandName = (typeof paletteCommandNames)[number];
export type ExternalPaletteCommand = Extract<
  PaletteCommandName,
  'import' | 'export' | 'logs' | 'theme' | 'snippet'
>;

export interface PaletteCommand {
  name: PaletteCommandName;
  description: string;
  usage: string;
}

export const paletteCommands: PaletteCommand[] = [
  { name: 'add', description: 'Add a connection', usage: ':add' },
  { name: 'edit', description: 'Edit the selected connection', usage: ':edit' },
  { name: 'delete', description: 'Delete selected connections', usage: ':delete' },
  {
    name: 'import',
    description: 'Preview or apply an import',
    usage: ':import <file> [--apply] [--strategy=skip|overwrite|rename]'
  },
  { name: 'export', description: 'Export connections', usage: ':export <file>' },
  { name: 'logs', description: 'Show the log file path', usage: ':logs' },
  { name: 'theme', description: 'Apply a theme', usage: ':theme <name>' },
  { name: 'snippet', description: 'Search command snippets', usage: ':snippet <query>' }
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

export const matchPaletteCommands = (query: string): PaletteCommand[] => {
  const commandQuery = query.trim().split(/\s+/, 1)[0] ?? '';
  return paletteCommands
    .map((command) => ({ command, score: fuzzyScore(commandQuery, command.name) }))
    .filter(
      (match): match is { command: PaletteCommand; score: number } => match.score !== undefined
    )
    .sort((left, right) => right.score - left.score)
    .map(({ command }) => command);
};

export const parsePaletteInput = (
  input: string
): { command?: PaletteCommandName; args: string[] } => {
  const [rawCommand, ...args] = input.trim().split(/\s+/).filter(Boolean);
  const command = paletteCommandNames.find((name) => name === rawCommand?.toLowerCase());
  return { ...(command ? { command } : {}), args };
};
