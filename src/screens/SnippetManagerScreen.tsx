import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import packageJson from '../../package.json' with { type: 'json' };
import { Frame } from '../components/Frame.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import type { SnippetService } from '../services/config/snippet-service.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';
import type { CommandSnippet, SnippetInput, SnippetPatch } from '../types/snippet.js';

interface SnippetManagerScreenProps {
  service: SnippetService;
  initialQuery?: string;
  onClose: () => void;
}

type ManagerMode = 'browse' | 'search' | 'add' | 'edit' | 'delete-confirm';

interface SnippetForm {
  name: string;
  command: string;
  description: string;
  tags: string;
}

interface FormField {
  key: keyof SnippetForm;
  label: string;
  required: boolean;
  hint?: string;
}

const fields: FormField[] = [
  { key: 'name', label: 'Name', required: true },
  {
    key: 'command',
    label: 'Command',
    required: true,
    hint: 'single line; placeholders use {{name}}'
  },
  { key: 'description', label: 'Description', required: false },
  { key: 'tags', label: 'Tags', required: false, hint: 'comma separated' }
];

const emptyForm: SnippetForm = {
  name: '',
  command: '',
  description: '',
  tags: ''
};

const formFromSnippet = (snippet: CommandSnippet): SnippetForm => ({
  name: snippet.name,
  command: snippet.command,
  description: snippet.description ?? '',
  tags: snippet.tags.join(', ')
});

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

export const SnippetManagerScreen = ({
  service,
  initialQuery = '',
  onClose
}: SnippetManagerScreenProps): React.ReactElement => {
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);
  const { columns, rows } = useTerminalSize();
  const compact = rows < 24 || columns < 100;
  const [mode, setMode] = useState<ManagerMode>(initialQuery ? 'search' : 'browse');
  const [query, setQuery] = useState(initialQuery);
  const [snippets, setSnippets] = useState<CommandSnippet[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [form, setForm] = useState<SnippetForm>(emptyForm);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [editingId, setEditingId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const selected = snippets[selectedIndex];
  const visibleCount = Math.max(rows - (compact ? 9 : 14), 3);
  const visibleSnippets = useMemo(() => {
    const start = Math.max(
      Math.min(selectedIndex - Math.floor(visibleCount / 2), snippets.length - visibleCount),
      0
    );
    return snippets.slice(start, start + visibleCount);
  }, [selectedIndex, snippets, visibleCount]);

  const reload = async (search = query): Promise<void> => {
    setLoading(true);
    try {
      setSnippets(await service.list(search.trim() ? { search } : {}));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load snippets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload(query);
  }, [query]);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(snippets.length - 1, 0)));
  }, [snippets.length]);

  const resetForm = (): void => {
    setForm(emptyForm);
    setFieldIndex(0);
    setEditingId(undefined);
    setSaving(false);
  };

  const closeForm = (): void => {
    resetForm();
    setMode('browse');
    setMessage('');
  };

  const validateForm = (): string | undefined => {
    const missing = fields.find((field) => field.required && !form[field.key].trim());
    if (missing) return `${missing.label} is required`;
    if (form.command.includes('\n') || form.command.includes('\r')) {
      return 'Command must be a single line';
    }
    return undefined;
  };

  const saveForm = (): void => {
    if (saving) return;
    const error = validateForm();
    if (error) {
      setMessage(error);
      return;
    }
    setSaving(true);
    const name = form.name.trim();
    const command = form.command.trim();
    const description = form.description.trim();
    const tags = parseTags(form.tags);
    const mutation =
      mode === 'edit' && editingId
        ? service.update(editingId, {
            name,
            command,
            description: description || null,
            tags
          } satisfies SnippetPatch)
        : service.add({
            name,
            command,
            ...(description ? { description } : {}),
            tags
          } satisfies SnippetInput);
    void mutation
      .then(async (snippet) => {
        resetForm();
        setMode('browse');
        setMessage(`${mode === 'edit' ? 'Updated' : 'Added'} ${snippet.name}`);
        await reload(query);
        const updated = await service.list(query.trim() ? { search: query } : {});
        const index = updated.findIndex(({ id }) => id === snippet.id);
        if (index >= 0) setSelectedIndex(index);
      })
      .catch((caught: unknown) => {
        setSaving(false);
        setMessage(caught instanceof Error ? caught.message : 'Failed to save snippet');
      });
  };

  const deleteSelected = (): void => {
    if (!selected || saving) return;
    setSaving(true);
    void service
      .delete(selected.id)
      .then(async (snippet) => {
        setMode('browse');
        setSaving(false);
        setMessage(`Deleted ${snippet.name}`);
        await reload(query);
      })
      .catch((caught: unknown) => {
        setSaving(false);
        setMessage(caught instanceof Error ? caught.message : 'Failed to delete snippet');
      });
  };

  useInput((input, key) => {
    if (mode === 'add' || mode === 'edit') {
      if (saving) return;
      if (key.escape) {
        closeForm();
      } else if (key.ctrl && input === 's') {
        saveForm();
      } else if (key.ctrl && input === 'u') {
        const field = fields[fieldIndex];
        if (field) setForm((current) => ({ ...current, [field.key]: '' }));
      } else if (key.upArrow) {
        setFieldIndex((current) => Math.max(current - 1, 0));
      } else if (key.downArrow || key.tab) {
        setFieldIndex((current) => Math.min(current + 1, fields.length - 1));
      } else if (key.return) {
        if (fieldIndex < fields.length - 1) setFieldIndex((current) => current + 1);
        else saveForm();
      } else {
        const field = fields[fieldIndex];
        if (!field) return;
        if (key.backspace || key.delete) {
          setForm((current) => ({
            ...current,
            [field.key]: current[field.key].slice(0, -1)
          }));
        } else if (input && !key.ctrl && !key.meta) {
          setForm((current) => ({
            ...current,
            [field.key]: `${current[field.key]}${input}`
          }));
        }
      }
      return;
    }

    if (mode === 'delete-confirm') {
      if (input.toLowerCase() === 'y') deleteSelected();
      else if (input.toLowerCase() === 'n' || key.escape) {
        setMode('browse');
        setMessage('Delete cancelled');
      }
      return;
    }

    if (mode === 'search') {
      if (key.escape) {
        if (query) {
          setQuery('');
          setSelectedIndex(0);
          setMode('browse');
        } else {
          onClose();
        }
      } else if (key.downArrow) {
        setSelectedIndex((current) => Math.min(current + 1, Math.max(snippets.length - 1, 0)));
      } else if (key.upArrow) {
        setSelectedIndex((current) => Math.max(current - 1, 0));
      } else if (key.return) {
        setMode('browse');
      } else if (key.backspace || key.delete) {
        setQuery((current) => current.slice(0, -1));
        setSelectedIndex(0);
      } else if (input && !key.ctrl && !key.meta) {
        setQuery((current) => `${current}${input}`);
        setSelectedIndex(0);
      }
      return;
    }

    if (input === 'q' || key.escape) {
      onClose();
    } else if (input === '/') {
      setMode('search');
      setQuery('');
      setSelectedIndex(0);
    } else if (input === 'a') {
      resetForm();
      setMode('add');
      setMessage('');
    } else if (input === 'e' && selected) {
      setForm(formFromSnippet(selected));
      setEditingId(selected.id);
      setFieldIndex(0);
      setMode('edit');
      setMessage('');
    } else if (input === 'd' && selected) {
      setMode('delete-confirm');
      setMessage('');
    } else if (input === 'r') {
      void reload(query);
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((current) => Math.min(current + 1, Math.max(snippets.length - 1, 0)));
    } else if (key.upArrow || input === 'k') {
      setSelectedIndex((current) => Math.max(current - 1, 0));
    }
  });

  const footer =
    mode === 'add' || mode === 'edit'
      ? `${glyphs.up}${glyphs.down}/tab field ${glyphs.separator} Ctrl+U clear ${glyphs.separator} Ctrl+S save ${glyphs.separator} Esc cancel`
      : mode === 'delete-confirm'
        ? `y confirm ${glyphs.separator} n/Esc cancel`
        : mode === 'search'
          ? `${glyphs.up}${glyphs.down} select ${glyphs.separator} type to search ${glyphs.separator} Enter manage ${glyphs.separator} Esc clear/back`
          : `a add ${glyphs.separator} e edit ${glyphs.separator} d delete ${glyphs.separator} / search ${glyphs.separator} q back`;

  return (
    <Frame
      title={
        <Text color={theme.accent} bold>
          {theme.decorated ? `${glyphs.brand} ` : ''}
          sshx snippets
          <Text color={theme.muted} dimColor>
            {' '}
            v{packageJson.version}
          </Text>
        </Text>
      }
      subtitle={
        !compact ? (
          <Text color={theme.muted}>
            {snippets.length} snippet{snippets.length === 1 ? '' : 's'}
          </Text>
        ) : undefined
      }
      footer={
        <Box flexDirection="column">
          <Text color={theme.muted}>{footer}</Text>
          {message ? <Text color={theme.warning}>{message}</Text> : null}
        </Box>
      }
      compact={compact}
      height={rows}
    >
      {mode === 'add' || mode === 'edit' ? (
        <Box flexDirection="column">
          <Text color={theme.accent} bold>
            {mode === 'add' ? 'Add Snippet' : 'Edit Snippet'}
          </Text>
          {fields.map((field, index) => {
            const active = index === fieldIndex;
            return (
              <Box key={field.key} flexDirection="column" marginTop={compact ? 0 : 1}>
                <Text color={active ? theme.accent : theme.muted} bold={active}>
                  {active ? `${glyphs.cursor} ` : '  '}
                  {field.label}: <Text color={theme.text}>{form[field.key]}</Text>
                  {active ? glyphs.inputCursor : ''}
                </Text>
                {active && field.hint ? (
                  <Text color={theme.muted}>
                    {'  '}
                    {field.hint}
                  </Text>
                ) : null}
              </Box>
            );
          })}
          {saving ? <Text color={theme.warning}>Saving{glyphs.ellipsis}</Text> : null}
        </Box>
      ) : mode === 'delete-confirm' ? (
        <Box
          flexDirection="column"
          borderStyle={theme.ascii ? 'classic' : 'round'}
          borderColor={theme.danger}
          paddingX={1}
        >
          <Text color={theme.danger} bold>
            Delete {selected?.name}?
          </Text>
          <Text color={theme.text}>{selected?.command}</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {mode === 'search' ? (
            <Text color={theme.accent} bold>
              /{query}
              {glyphs.inputCursor}
            </Text>
          ) : null}
          {loading ? (
            <Text color={theme.accent}>Loading snippets{glyphs.ellipsis}</Text>
          ) : visibleSnippets.length === 0 ? (
            <Text color={theme.muted}>
              {query ? 'No matching snippets' : 'No snippets yet. Press a to add one.'}
            </Text>
          ) : (
            visibleSnippets.map((snippet) => {
              const active = snippet.id === selected?.id;
              return (
                <Text
                  key={snippet.id}
                  color={active ? theme.accent : theme.text}
                  bold={active}
                  wrap="truncate"
                >
                  {active ? `${glyphs.cursor} ` : '  '}
                  {snippet.name}
                  {snippet.tags.length > 0 ? `  #${snippet.tags.join(' #')}` : ''}
                </Text>
              );
            })
          )}
          {selected ? (
            <Box flexDirection="column" marginTop={compact ? 0 : 1}>
              <Text color={theme.muted}>{selected.description ?? 'No description'}</Text>
              <Text color={theme.text} wrap="truncate">
                {selected.command}
              </Text>
            </Box>
          ) : null}
        </Box>
      )}
    </Frame>
  );
};
