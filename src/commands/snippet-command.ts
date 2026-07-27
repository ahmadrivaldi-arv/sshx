import type { Command } from 'commander';
import type { SnippetService } from '../services/config/snippet-service.js';
import type { SnippetPatch } from '../types/snippet.js';

interface SnippetListOptions {
  search?: string;
  tags?: string;
}

interface SnippetAddOptions {
  command: string;
  description?: string;
  tags?: string;
}

interface SnippetEditOptions {
  name?: string;
  command?: string;
  description?: string;
  clearDescription?: boolean;
  tags?: string;
}

const parseTags = (value?: string): string[] | undefined =>
  value === undefined
    ? undefined
    : value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

export const registerSnippetCommand = (program: Command, service: SnippetService): void => {
  const snippetCommand = program.command('snippet').description('Manage reusable command snippets');

  snippetCommand
    .command('list')
    .alias('ls')
    .description('List and search snippets')
    .option('-s, --search <query>', 'Fuzzy search snippets')
    .option('-t, --tags <tags>', 'Require comma-separated tags')
    .action(async (options: SnippetListOptions): Promise<void> => {
      const snippets = await service.list({
        ...(options.search ? { search: options.search } : {}),
        ...(options.tags ? { tags: parseTags(options.tags) } : {})
      });
      if (snippets.length === 0) {
        process.stdout.write('No snippets found\n');
        return;
      }
      for (const snippet of snippets) {
        const tags = snippet.tags.length > 0 ? ` [${snippet.tags.join(', ')}]` : '';
        process.stdout.write(`${snippet.id}  ${snippet.name}${tags}\n  ${snippet.command}\n`);
      }
    });

  snippetCommand
    .command('show')
    .description('Show one snippet')
    .argument('<name-or-id>', 'Snippet name or ID')
    .action(async (identifier: string): Promise<void> => {
      const snippet = await service.get(identifier);
      process.stdout.write(`${snippet.name}\n${snippet.command}\n`);
      if (snippet.description) process.stdout.write(`${snippet.description}\n`);
      if (snippet.tags.length > 0) process.stdout.write(`Tags: ${snippet.tags.join(', ')}\n`);
    });

  snippetCommand
    .command('add')
    .description('Add a command snippet')
    .argument('<name>', 'Unique snippet name')
    .requiredOption('-c, --command <command>', 'Command text')
    .option('-d, --description <text>', 'Snippet description')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .action(async (name: string, options: SnippetAddOptions): Promise<void> => {
      const snippet = await service.add({
        name,
        command: options.command,
        ...(options.description ? { description: options.description } : {}),
        ...(options.tags ? { tags: parseTags(options.tags) } : {})
      });
      process.stdout.write(`Added snippet ${snippet.name}\n`);
    });

  snippetCommand
    .command('edit')
    .description('Edit a command snippet')
    .argument('<name-or-id>', 'Snippet name or ID')
    .option('--name <name>', 'New snippet name')
    .option('-c, --command <command>', 'New command text')
    .option('-d, --description <text>', 'New description')
    .option('--clear-description', 'Remove the description')
    .option('-t, --tags <tags>', 'Replace comma-separated tags')
    .action(async (identifier: string, options: SnippetEditOptions): Promise<void> => {
      if (options.description && options.clearDescription) {
        throw new Error('Use either --description or --clear-description, not both');
      }
      const tags = parseTags(options.tags);
      const patch: SnippetPatch = {
        ...(options.name ? { name: options.name } : {}),
        ...(options.command ? { command: options.command } : {}),
        ...(options.clearDescription
          ? { description: null }
          : options.description
            ? { description: options.description }
            : {}),
        ...(tags ? { tags } : {})
      };
      if (Object.keys(patch).length === 0) {
        throw new Error('Provide at least one field to edit');
      }
      const snippet = await service.update(identifier, patch);
      process.stdout.write(`Updated snippet ${snippet.name}\n`);
    });

  snippetCommand
    .command('delete')
    .alias('rm')
    .description('Delete a command snippet')
    .argument('<name-or-id>', 'Snippet name or ID')
    .action(async (identifier: string): Promise<void> => {
      const snippet = await service.delete(identifier);
      process.stdout.write(`Deleted snippet ${snippet.name}\n`);
    });

  snippetCommand.action(async (): Promise<void> => {
    const snippets = await service.list();
    process.stdout.write(
      snippets.length > 0
        ? `${snippets.map(({ name }) => name).join('\n')}\n`
        : 'No snippets found\n'
    );
  });
};
