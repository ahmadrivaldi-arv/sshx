import type { Command } from 'commander';
import type { KeymapService } from '../services/config/keymap-service.js';

const renderKeymap = (keymap: Awaited<ReturnType<KeymapService['get']>>): string =>
  [
    `snippet-picker  ${keymap.snippetPicker.join(',')}`,
    `snippet-manager ${keymap.snippetManager}`
  ].join('\n');

export const registerKeymapCommand = (program: Command, service: KeymapService): void => {
  const keymapCommand = program.command('keymap').description('Configure keyboard shortcuts');

  keymapCommand
    .command('set')
    .description('Set a keymap action')
    .argument('<action>', 'snippet-picker or snippet-manager')
    .argument('<binding>', 'Shortcut binding or comma-separated bindings')
    .action(async (action: string, binding: string): Promise<void> => {
      if (action === 'snippet-picker') {
        const keymap = await service.setSnippetPicker(binding.split(','));
        process.stdout.write(`${renderKeymap(keymap)}\n`);
        return;
      }
      if (action === 'snippet-manager') {
        const keymap = await service.setSnippetManager(binding);
        process.stdout.write(`${renderKeymap(keymap)}\n`);
        return;
      }
      throw new Error('Keymap action must be snippet-picker or snippet-manager');
    });

  keymapCommand
    .command('reset')
    .description('Restore default keymaps')
    .action(async (): Promise<void> => {
      process.stdout.write(`${renderKeymap(await service.reset())}\n`);
    });

  keymapCommand.action(async (): Promise<void> => {
    process.stdout.write(`${renderKeymap(await service.get())}\n`);
  });
};
