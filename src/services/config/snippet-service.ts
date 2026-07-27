import type { CommandSnippet, SnippetInput, SnippetPatch } from '../../types/snippet.js';
import { AppError } from '../../utils/app-error.js';
import { createId } from '../../utils/id.js';
import { fuzzyScore } from '../palette/command-palette.js';
import { ConfigService } from './config-service.js';

export interface ListSnippetOptions {
  search?: string | undefined;
  tags?: string[] | undefined;
}

const normalizeTags = (tags: string[] = []): string[] => [
  ...new Set(tags.map((tag) => tag.trim()).filter(Boolean))
];

export class SnippetService {
  public constructor(private readonly configService: ConfigService = new ConfigService()) {}

  public async list(options: ListSnippetOptions = {}): Promise<CommandSnippet[]> {
    const config = await this.configService.load();
    const search = options.search?.trim() ?? '';
    const requestedTags = normalizeTags(options.tags).map((tag) => tag.toLowerCase());

    return config.snippets
      .filter((snippet) =>
        requestedTags.every((tag) =>
          snippet.tags.some((snippetTag) => snippetTag.toLowerCase() === tag)
        )
      )
      .map((snippet) => ({
        snippet,
        score: search
          ? fuzzyScore(
              search,
              `${snippet.name} ${snippet.description ?? ''} ${snippet.tags.join(' ')} ${snippet.command}`
            )
          : 0
      }))
      .filter(
        (entry): entry is { snippet: CommandSnippet; score: number } => entry.score !== undefined
      )
      .sort(
        (left, right) =>
          right.score - left.score || left.snippet.name.localeCompare(right.snippet.name)
      )
      .map(({ snippet }) => snippet);
  }

  public async get(identifier: string): Promise<CommandSnippet> {
    const config = await this.configService.load();
    const normalized = identifier.toLowerCase();
    const snippet = config.snippets.find(
      (candidate) => candidate.id === identifier || candidate.name.toLowerCase() === normalized
    );

    if (!snippet) {
      throw new AppError('SNIPPET_NOT_FOUND', `Snippet "${identifier}" was not found`);
    }

    return snippet;
  }

  public async add(input: SnippetInput): Promise<CommandSnippet> {
    const config = await this.configService.load();
    const name = input.name.trim();
    const command = input.command.trim();
    this.assertValid(name, command);
    this.assertUnique(config.snippets, name);
    const now = new Date().toISOString();
    const snippet: CommandSnippet = {
      id: createId(),
      name,
      command,
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      tags: normalizeTags(input.tags),
      createdAt: now,
      updatedAt: now
    };
    await this.configService.save({
      ...config,
      snippets: [...config.snippets, snippet]
    });
    return snippet;
  }

  public async update(identifier: string, patch: SnippetPatch): Promise<CommandSnippet> {
    const config = await this.configService.load();
    const existing = await this.get(identifier);
    const name = patch.name?.trim() ?? existing.name;
    const command = patch.command?.trim() ?? existing.command;
    this.assertValid(name, command);
    this.assertUnique(config.snippets, name, existing.id);
    const updated: CommandSnippet = {
      ...existing,
      name,
      command,
      ...(patch.description === null
        ? { description: undefined }
        : patch.description !== undefined
          ? { description: patch.description.trim() || undefined }
          : {}),
      ...(patch.tags ? { tags: normalizeTags(patch.tags) } : {}),
      updatedAt: new Date().toISOString()
    };
    const normalized: CommandSnippet = {
      id: updated.id,
      name: updated.name,
      command: updated.command,
      ...(updated.description ? { description: updated.description } : {}),
      tags: updated.tags,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
    await this.configService.save({
      ...config,
      snippets: config.snippets.map((snippet) =>
        snippet.id === existing.id ? normalized : snippet
      )
    });
    return normalized;
  }

  public async delete(identifier: string): Promise<CommandSnippet> {
    const config = await this.configService.load();
    const normalized = identifier.toLowerCase();
    const snippet = config.snippets.find(
      (candidate) => candidate.id === identifier || candidate.name.toLowerCase() === normalized
    );
    if (!snippet) {
      throw new AppError('SNIPPET_NOT_FOUND', `Snippet "${identifier}" was not found`);
    }
    await this.configService.save({
      ...config,
      snippets: config.snippets.filter((candidate) => candidate.id !== snippet.id)
    });
    return snippet;
  }

  private assertValid(name: string, command: string): void {
    if (!name) throw new Error('Snippet name is required');
    if (!command) throw new Error('Snippet command is required');
  }

  private assertUnique(snippets: CommandSnippet[], name: string, excludedId?: string): void {
    if (
      snippets.some(
        (snippet) => snippet.id !== excludedId && snippet.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new AppError('SNIPPET_DUPLICATE', `Snippet "${name}" already exists`);
    }
  }
}
