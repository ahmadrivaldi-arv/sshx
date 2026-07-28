import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import packageJson from '../../package.json' with { type: 'json' };
import { ConnectionDetail } from '../components/ConnectionDetail.js';
import { ConnectionTree, getConnectionTreeItems } from '../components/ConnectionTree.js';
import { Frame } from '../components/Frame.js';
import { KeyHints, type KeyHint } from '../components/KeyHints.js';
import { SearchBar } from '../components/SearchBar.js';
import { SshxLogo } from '../components/SshxLogo.js';
import { StatusMessage } from '../components/StatusMessage.js';
import { useConnections } from '../hooks/useConnections.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import type { ConnectionService } from '../services/config/connection-service.js';
import {
  matchPaletteCommands,
  parsePaletteInput,
  type ExternalPaletteCommand,
  type PaletteCommandName
} from '../services/palette/command-palette.js';
import type { ConnectionHealthService } from '../services/ssh/connection-health-service.js';
import { formatSshOptions, parseSshOptionsText } from '../services/ssh/ssh-options.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';
import type { ConnectionInput, ConnectionPatch, SshConnection } from '../types/connection.js';
import { getResponsiveLayout } from '../utils/responsive-layout.js';

interface MainScreenProps {
  connectionService: ConnectionService;
  healthService: ConnectionHealthService;
  onPaletteCommand: (command: ExternalPaletteCommand, args: string[]) => Promise<string>;
  onOpenSnippets: (query: string) => void;
  onOpenThemes: () => void;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
  snippetManagerKey: string;
  onConnect: (connection: SshConnection) => void;
}

type ScreenMode =
  'browse' | 'search' | 'add' | 'edit' | 'delete-confirm' | 'bulk-group' | 'bulk-tags' | 'palette';

interface FormState {
  name: string;
  host: string;
  username: string;
  port: string;
  password: string;
  identityFile: string;
  group: string;
  tags: string;
  sshOptions: string;
  suppressWeakCryptoWarning: string;
}

interface FormField {
  key: keyof FormState;
  label: string;
  required: boolean;
  masked?: boolean;
  hint?: string;
}

const fields: FormField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'host', label: 'Host', required: true },
  { key: 'username', label: 'Username', required: true },
  { key: 'port', label: 'Port', required: true, hint: '1-65535' },
  {
    key: 'password',
    label: 'Password',
    required: false,
    masked: true,
    hint: 'blank keeps the current password'
  },
  { key: 'identityFile', label: 'Identity file', required: false },
  { key: 'group', label: 'Group', required: false },
  { key: 'tags', label: 'Tags', required: false, hint: 'comma separated' },
  {
    key: 'sshOptions',
    label: 'SSH options',
    required: false,
    hint: 'Key=Value, Key=Value'
  },
  {
    key: 'suppressWeakCryptoWarning',
    label: 'Hide weak warning',
    required: true,
    hint: 'yes or no'
  }
];

const emptyForm: FormState = {
  name: '',
  host: '',
  username: '',
  port: '22',
  password: '',
  identityFile: '',
  group: '',
  tags: '',
  sshOptions: '',
  suppressWeakCryptoWarning: 'no'
};

const createEditForm = (connection: SshConnection): FormState => ({
  name: connection.name,
  host: connection.host,
  username: connection.username,
  port: String(connection.port),
  password: '',
  identityFile: connection.identityFile ?? '',
  group: connection.group ?? '',
  tags: connection.tags.join(', '),
  sshOptions: formatSshOptions(connection.sshOptions),
  suppressWeakCryptoWarning: connection.suppressWeakCryptoWarning ? 'yes' : 'no'
});

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const parseBoolean = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();

  if (['yes', 'y', 'true', '1', 'on'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0', 'off'].includes(normalized)) return false;

  throw new Error('Hide weak warning must be yes or no');
};

const validateForm = (form: FormState): string | undefined => {
  const missing = fields.find((field) => field.required && !form[field.key].trim());

  if (missing) return `${missing.label} is required`;

  const port = Number(form.port);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return 'Port must be an integer from 1 to 65535';
  }

  try {
    parseSshOptionsText(form.sshOptions);
    parseBoolean(form.suppressWeakCryptoWarning);
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid connection options';
  }

  return undefined;
};

const toConnectionInput = (form: FormState): ConnectionInput => ({
  name: form.name.trim(),
  host: form.host.trim(),
  username: form.username.trim(),
  port: Number(form.port),
  ...(form.password ? { password: form.password } : {}),
  ...(form.identityFile.trim() ? { identityFile: form.identityFile.trim() } : {}),
  ...(form.group.trim() ? { group: form.group.trim() } : {}),
  tags: parseTags(form.tags),
  sshOptions: parseSshOptionsText(form.sshOptions),
  suppressWeakCryptoWarning: parseBoolean(form.suppressWeakCryptoWarning)
});

const toConnectionPatch = (form: FormState): ConnectionPatch => ({
  name: form.name.trim(),
  host: form.host.trim(),
  username: form.username.trim(),
  port: Number(form.port),
  ...(form.password ? { password: form.password } : {}),
  identityFile: form.identityFile.trim() || null,
  group: form.group.trim() || null,
  tags: parseTags(form.tags),
  sshOptions: parseSshOptionsText(form.sshOptions),
  suppressWeakCryptoWarning: parseBoolean(form.suppressWeakCryptoWarning)
});

export const MainScreen = ({
  connectionService,
  healthService,
  onPaletteCommand,
  onOpenSnippets,
  onOpenThemes,
  onOpenHelp,
  onOpenAbout,
  snippetManagerKey,
  onConnect
}: MainScreenProps): React.ReactElement => {
  const app = useApp();
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);
  const { columns, rows } = useTerminalSize();
  const [compactOverride, setCompactOverride] = useState<boolean>();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ScreenMode>('browse');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [editingId, setEditingId] = useState<string>();
  const [deleteTargets, setDeleteTargets] = useState<SshConnection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<PaletteCommandName[]>([]);
  const [narrowPanel, setNarrowPanel] = useState<'list' | 'detail'>('list');
  const options = useMemo(() => ({ search: query }), [query]);
  const { connections, loading, error, reload } = useConnections(connectionService, options);
  const visibleConnections = useMemo(() => getConnectionTreeItems(connections), [connections]);
  const paletteMatches = useMemo(
    () => matchPaletteCommands(paletteQuery, recentCommands),
    [paletteQuery, recentCommands]
  );
  const selectedConnection = visibleConnections[selectedIndex];
  const responsiveLayout = getResponsiveLayout(columns, rows);
  const responsiveCompact = responsiveLayout === 'narrow';
  const compact = responsiveCompact || (compactOverride ?? theme.compact);
  const maxVisible = Math.max(Math.floor((rows - (compact ? 11 : 8)) / 2), 1);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(visibleConnections.length - 1, 0)));
  }, [visibleConnections.length]);

  useEffect(() => {
    if (!message || saving || checking) return;
    const timeout = setTimeout(() => setMessage(''), 4000);
    return (): void => clearTimeout(timeout);
  }, [checking, message, saving]);

  const resetMode = (): void => {
    setMode('browse');
    setForm(emptyForm);
    setFieldIndex(0);
    setEditingId(undefined);
    setDeleteTargets([]);
    setBulkValue('');
    setPaletteQuery('');
    setPaletteIndex(0);
    setSaving(false);
  };

  const connectSelected = (): void => {
    if (selectedConnection) {
      onConnect(selectedConnection);
      app.exit();
    }
  };

  const checkConnections = (targets: SshConnection[]): void => {
    if (checking || targets.length === 0) return;
    setChecking(true);
    setMessage(`Checking ${targets.length} connection${targets.length === 1 ? '' : 's'}...`);
    void healthService
      .checkMany(targets)
      .then(async (results) => {
        const online = results.filter(({ status }) => status === 'online').length;
        setMessage(`Health check complete: ${online}/${results.length} online`);
        await reload(options);
      })
      .catch((caughtError: unknown) => {
        setMessage(caughtError instanceof Error ? caughtError.message : 'Health check failed');
      })
      .finally(() => setChecking(false));
  };

  const moveField = (delta: number): void => {
    setFieldIndex((current) => Math.min(Math.max(current + delta, 0), fields.length - 1));
    setMessage('');
  };

  const saveForm = (advanceOnly: boolean): void => {
    if (saving) return;

    const field = fields[fieldIndex];

    if (!field) return;

    if (advanceOnly && field.required && !form[field.key].trim()) {
      setMessage(`${field.label} is required`);
      return;
    }

    if (advanceOnly && fieldIndex < fields.length - 1) {
      moveField(1);
      return;
    }

    const validationError = validateForm(form);

    if (validationError) {
      const invalidField = fields.findIndex((candidate) =>
        validationError.startsWith(candidate.label)
      );

      if (invalidField >= 0) setFieldIndex(invalidField);
      setMessage(validationError);
      return;
    }

    setSaving(true);
    setMessage('');

    const mutation =
      mode === 'add'
        ? connectionService.add(toConnectionInput(form))
        : editingId
          ? connectionService.update(editingId, toConnectionPatch(form))
          : Promise.reject(new Error('No connection selected'));

    void mutation
      .then(async (connection) => {
        const action = mode === 'add' ? 'Added' : 'Updated';
        resetMode();
        setQuery('');
        setSelectedIndex(0);
        setMessage(`${action} ${connection.name}`);
        await reload({});
      })
      .catch((caughtError: unknown) => {
        setSaving(false);
        setMessage(
          caughtError instanceof Error ? caughtError.message : 'Failed to save connection'
        );
      });
  };

  const deleteConnection = (): void => {
    if (deleteTargets.length === 0 || saving) return;

    setSaving(true);
    setMessage('');

    void connectionService
      .bulkDelete(deleteTargets.map(({ id }) => id))
      .then(async (count) => {
        resetMode();
        setQuery('');
        setSelectedIds(new Set());
        setMessage(`Deleted ${count} connection${count === 1 ? '' : 's'}`);
        await reload({});
      })
      .catch((caughtError: unknown) => {
        setSaving(false);
        setMessage(
          caughtError instanceof Error ? caughtError.message : 'Failed to delete connection'
        );
      });
  };

  useInput((input, key) => {
    if (key.escape) {
      if (mode !== 'browse') {
        resetMode();
        setQuery('');
        setSelectedIndex(0);
        setMessage('');
      }
      return;
    }

    if (mode === 'search') {
      if (key.return) {
        if (query.trim().toLowerCase() === 'add') {
          setQuery('');
          setMode('add');
          setForm(emptyForm);
          setFieldIndex(0);
          setMessage('');
        } else {
          connectSelected();
        }
      } else if (key.downArrow) {
        setSelectedIndex((current) =>
          Math.min(current + 1, Math.max(visibleConnections.length - 1, 0))
        );
      } else if (key.upArrow) {
        setSelectedIndex((current) => Math.max(current - 1, 0));
      } else if (key.backspace || key.delete) {
        setQuery((current) => current.slice(0, -1));
        setSelectedIndex(0);
      } else if (input && !key.ctrl && !key.meta) {
        setQuery((current) => `${current}${input}`);
        setSelectedIndex(0);
      }
      return;
    }

    if (mode === 'palette') {
      if (key.downArrow) {
        setPaletteIndex((current) => Math.min(current + 1, Math.max(paletteMatches.length - 1, 0)));
      } else if (key.upArrow) {
        setPaletteIndex((current) => Math.max(current - 1, 0));
      } else if (key.backspace || key.delete) {
        setPaletteQuery((current) => current.slice(0, -1));
        setPaletteIndex(0);
      } else if (key.return) {
        const parsed = parsePaletteInput(paletteQuery);
        const command = parsed.command ?? paletteMatches[paletteIndex]?.name;

        if (!command) {
          setMessage('No matching command');
          return;
        }

        setRecentCommands((current) => [
          command,
          ...current.filter((name) => name !== command).slice(0, 4)
        ]);

        if (command === 'snippet') {
          onOpenSnippets(parsed.args.join(' '));
        } else if (command === 'theme' && parsed.args.length === 0) {
          onOpenThemes();
        } else if (command === 'help') {
          onOpenHelp();
        } else if (command === 'about') {
          onOpenAbout();
        } else if (command === 'add') {
          setMode('add');
          setForm(emptyForm);
          setFieldIndex(0);
          setMessage('');
        } else if (command === 'edit' && selectedConnection) {
          setMode('edit');
          setEditingId(selectedConnection.id);
          setForm(createEditForm(selectedConnection));
          setFieldIndex(0);
          setMessage('');
        } else if (command === 'delete' && selectedConnection) {
          setDeleteTargets(
            selectedIds.size > 0
              ? visibleConnections.filter(({ id }) => selectedIds.has(id))
              : [selectedConnection]
          );
          setMode('delete-confirm');
          setMessage('');
        } else if (command === 'edit' || command === 'delete') {
          setMessage('Select a connection first');
        } else {
          setSaving(true);
          void onPaletteCommand(command, parsed.args)
            .then(async (result) => {
              resetMode();
              setMessage(result);
              await reload({});
            })
            .catch((caughtError: unknown) => {
              setSaving(false);
              setMessage(caughtError instanceof Error ? caughtError.message : 'Command failed');
            });
        }
      } else if (input && !key.ctrl && !key.meta) {
        setPaletteQuery((current) => `${current}${input}`);
        setPaletteIndex(0);
      }
      return;
    }

    if (mode === 'add' || mode === 'edit') {
      const field = fields[fieldIndex];

      if (!field || saving) return;

      if (key.ctrl && input === 's') {
        saveForm(false);
      } else if (key.return) {
        saveForm(true);
      } else if (key.tab || key.downArrow) {
        moveField(key.shift ? -1 : 1);
      } else if (key.upArrow) {
        moveField(-1);
      } else if (key.backspace || key.delete) {
        setForm((current) => ({
          ...current,
          [field.key]: current[field.key].slice(0, -1)
        }));
        setMessage('');
      } else if (key.ctrl && input === 'u') {
        setForm((current) => ({
          ...current,
          [field.key]: ''
        }));
        setMessage('');
      } else if (input && !key.ctrl && !key.meta) {
        setForm((current) => ({
          ...current,
          [field.key]: `${current[field.key]}${input}`
        }));
        setMessage('');
      }
      return;
    }

    if (mode === 'bulk-group' || mode === 'bulk-tags') {
      if (key.return) {
        const ids =
          selectedIds.size > 0
            ? [...selectedIds]
            : selectedConnection
              ? [selectedConnection.id]
              : [];
        const mutation =
          mode === 'bulk-group'
            ? connectionService.bulkAssignGroup(ids, bulkValue || undefined)
            : connectionService.bulkAssignTags(ids, parseTags(bulkValue), 'replace');

        setSaving(true);
        void mutation
          .then(async (count) => {
            const action = mode === 'bulk-group' ? 'group' : 'tags';
            resetMode();
            setMessage(`Updated ${action} for ${count} connection${count === 1 ? '' : 's'}`);
            await reload(options);
          })
          .catch((caughtError: unknown) => {
            setSaving(false);
            setMessage(
              caughtError instanceof Error ? caughtError.message : 'Failed to update connections'
            );
          });
      } else if (key.backspace || key.delete) {
        setBulkValue((current) => current.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setBulkValue((current) => `${current}${input}`);
      }
      return;
    }

    if (mode === 'delete-confirm') {
      if (input.toLowerCase() === 'y') {
        deleteConnection();
      } else if (input.toLowerCase() === 'n' || key.return) {
        resetMode();
        setMessage('Delete cancelled');
      }
      return;
    }

    if (key.tab && responsiveLayout === 'narrow' && selectedConnection) {
      setNarrowPanel((current) => (current === 'list' ? 'detail' : 'list'));
    } else if (input === 'q') {
      app.exit();
    } else if (input === '?') {
      onOpenHelp();
    } else if (input === 'T') {
      onOpenThemes();
    } else if (input === snippetManagerKey) {
      onOpenSnippets('');
    } else if (input === '/') {
      setMode('search');
      setQuery('');
      setMessage('');
    } else if (input === ':') {
      setMode('palette');
      setPaletteQuery('');
      setPaletteIndex(0);
      setMessage('');
    } else if (input === 'a') {
      setMode('add');
      setForm(emptyForm);
      setFieldIndex(0);
      setMessage('');
    } else if (input === 'e' && selectedConnection) {
      setMode('edit');
      setEditingId(selectedConnection.id);
      setForm(createEditForm(selectedConnection));
      setFieldIndex(0);
      setMessage('');
    } else if (input === 'd' && selectedConnection) {
      setDeleteTargets(
        selectedIds.size > 0
          ? visibleConnections.filter(({ id }) => selectedIds.has(id))
          : [selectedConnection]
      );
      setMode('delete-confirm');
      setMessage('');
    } else if (input === 'f' && selectedConnection) {
      const selected = selectedIds.size > 0 ? [...selectedIds] : [selectedConnection.id];
      const mutation =
        selectedIds.size > 0
          ? connectionService.bulkSetFavorite(selected, true)
          : connectionService.toggleFavorite(selectedConnection.id);
      void mutation
        .then(async () => {
          const nextConnections = await reload(options);
          const nextItems = getConnectionTreeItems(nextConnections);
          const nextIndex = nextItems.findIndex((item) => item.id === selectedConnection.id);

          if (nextIndex >= 0) setSelectedIndex(nextIndex);
        })
        .catch((caughtError: unknown) => {
          setMessage(
            caughtError instanceof Error ? caughtError.message : 'Failed to update connection'
          );
        });
    } else if (input === ' ' && selectedConnection) {
      setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(selectedConnection.id)) next.delete(selectedConnection.id);
        else next.add(selectedConnection.id);
        return next;
      });
    } else if ((input === 'g' || input === 't') && selectedConnection) {
      setMode(input === 'g' ? 'bulk-group' : 'bulk-tags');
      setBulkValue('');
      setMessage('');
    } else if (input === 'h' && selectedConnection) {
      const targets =
        selectedIds.size > 0
          ? visibleConnections.filter(({ id }) => selectedIds.has(id))
          : [selectedConnection];
      checkConnections(targets);
    } else if (input === 'H') {
      checkConnections(visibleConnections);
    } else if (input === 'c') {
      if (responsiveCompact) {
        setMessage('Compact layout is required at this terminal size');
      } else {
        setCompactOverride(!compact);
        setMessage(compact ? 'Expanded layout enabled' : 'Compact layout enabled');
      }
    } else if (input === 'r') {
      void reload(options);
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((current) =>
        Math.min(current + 1, Math.max(visibleConnections.length - 1, 0))
      );
    } else if (key.upArrow || input === 'k') {
      setSelectedIndex((current) => Math.max(current - 1, 0));
    } else if (key.return) {
      connectSelected();
    }
  });

  const subtitle =
    mode === 'browse'
      ? `${theme.name} ${glyphs.separator} ${connections.length} connection${
          connections.length === 1 ? '' : 's'
        }`
      : mode === 'search'
        ? `search ${glyphs.separator} ${connections.length} found`
        : mode === 'delete-confirm'
          ? 'confirm delete'
          : mode === 'bulk-group'
            ? 'assign group'
            : mode === 'bulk-tags'
              ? 'assign tags'
              : mode === 'palette'
                ? 'command palette'
                : mode;

  const footerHints: KeyHint[] =
    mode === 'add' || mode === 'edit'
      ? [
          { key: `${glyphs.up}${glyphs.down}/Tab`, label: 'change field' },
          { key: '^U', label: 'clear field' },
          { key: glyphs.enter, label: 'next field' },
          { key: '^S', label: 'save' },
          { key: 'Esc', label: 'cancel' }
        ]
      : mode === 'delete-confirm'
        ? [
            { key: 'y', label: 'confirm delete' },
            { key: 'n/Esc', label: 'cancel' }
          ]
        : mode === 'bulk-group' || mode === 'bulk-tags'
          ? [
              { key: glyphs.enter, label: 'apply' },
              { key: 'Esc', label: 'cancel' }
            ]
          : mode === 'palette'
            ? [
                { key: `${glyphs.up}${glyphs.down}`, label: 'select command' },
                { key: glyphs.enter, label: 'run' },
                { key: 'Esc', label: 'cancel' }
              ]
            : mode === 'search'
              ? [
                  { key: `${glyphs.up}${glyphs.down}`, label: 'select connection' },
                  { key: glyphs.enter, label: 'connect' },
                  { key: 'Esc', label: 'clear search' }
                ]
              : [
                  { key: glyphs.enter, label: 'connect' },
                  ...(responsiveLayout === 'narrow'
                    ? [
                        {
                          key: 'Tab',
                          label: narrowPanel === 'list' ? 'details' : 'connection list'
                        }
                      ]
                    : []),
                  { key: snippetManagerKey, label: 'snippets' },
                  { key: ':', label: 'commands' },
                  { key: 'T', label: 'themes' },
                  { key: '?', label: 'help' },
                  { key: 'q', label: 'quit' }
                ];

  const formFields = compact ? fields.filter((_, index) => index === fieldIndex) : fields;

  return (
    <Frame
      title={
        <Text color={theme.accent} bold>
          {theme.decorated ? `${glyphs.brand} ` : ''}
          sshx
          <Text color={theme.muted} dimColor>
            {' '}
            v{packageJson.version}
          </Text>
        </Text>
      }
      subtitle={!compact ? <Text color={theme.muted}>{subtitle}</Text> : undefined}
      footer={
        <Box flexDirection="column" width="100%">
          <KeyHints
            hints={footerHints}
            compact={compact}
            limit={compact ? 4 : responsiveLayout === 'medium' ? 5 : undefined}
          />
          <StatusMessage message={message} tone={saving ? 'info' : 'warning'} busy={saving} />
        </Box>
      }
      compact={compact}
      height={rows}
    >
      {mode === 'add' || mode === 'edit' ? (
        <Box flexDirection="column" overflow="hidden">
          <Box justifyContent="space-between" marginBottom={compact ? 0 : 1}>
            <Text color={theme.accent} bold>
              {mode === 'add' ? 'Add Connection' : 'Edit Connection'}
              {saving ? ` ${glyphs.empty} saving${glyphs.ellipsis}` : ''}
            </Text>
            <Text color={theme.muted}>
              {fieldIndex + 1}/{fields.length}
            </Text>
          </Box>
          {formFields.map((field) => {
            const index = fields.indexOf(field);
            const value = form[field.key];
            const displayValue = field.masked ? '*'.repeat(value.length) : value;
            const active = index === fieldIndex;

            return (
              <Box key={field.key} flexDirection="column" marginBottom={compact ? 0 : 1}>
                <Box>
                  <Text color={active ? theme.accent : theme.muted} bold={active}>
                    {active ? `${glyphs.cursor} ` : '  '}
                    {field.label.padEnd(compact ? 0 : 18)}
                    {compact ? ': ' : ''}
                  </Text>
                  <Text color={active ? theme.accent : theme.text} dimColor={!active}>
                    {displayValue || (field.required ? '(required)' : glyphs.empty)}
                    {active ? glyphs.inputCursor : ''}
                  </Text>
                </Box>
                {active && field.hint ? (
                  <Text color={theme.muted} dimColor>
                    {'  '}
                    {field.hint}
                  </Text>
                ) : null}
              </Box>
            );
          })}
        </Box>
      ) : mode === 'palette' ? (
        <Box flexDirection="column">
          <Text color={theme.accent} bold>
            :{paletteQuery}
            {glyphs.inputCursor}
          </Text>
          {paletteMatches.length === 0 ? (
            <Text color={theme.muted}>No matching commands</Text>
          ) : (
            paletteMatches.slice(0, 7).map((command, index, visible) => (
              <Box key={command.name} flexDirection="column">
                {!compact && command.group !== visible[index - 1]?.group ? (
                  <Text color={theme.muted} dimColor>
                    {recentCommands.includes(command.name) && !paletteQuery ? 'RECENT · ' : ''}
                    {command.group.toUpperCase()}
                  </Text>
                ) : null}
                <Box justifyContent="space-between">
                  <Text
                    color={index === paletteIndex ? theme.selected : theme.text}
                    bold={index === paletteIndex}
                  >
                    {index === paletteIndex ? `${glyphs.cursor} ` : '  '}
                    {command.usage}
                    {!compact ? <Text color={theme.muted}> — {command.description}</Text> : null}
                  </Text>
                  {!compact && command.shortcut ? (
                    <Text color={theme.muted}>{command.shortcut}</Text>
                  ) : null}
                </Box>
              </Box>
            ))
          )}
        </Box>
      ) : mode === 'bulk-group' || mode === 'bulk-tags' ? (
        <Box flexDirection="column">
          <Text color={theme.accent} bold>
            {mode === 'bulk-group' ? 'Assign group' : 'Replace tags'}
          </Text>
          <Text color={theme.muted}>
            {selectedIds.size || (selectedConnection ? 1 : 0)} connection(s)
          </Text>
          <Text color={theme.text}>
            {mode === 'bulk-tags' ? 'Comma-separated tags: ' : 'Group (blank clears): '}
            <Text color={theme.accent}>
              {bulkValue}
              {glyphs.inputCursor}
            </Text>
          </Text>
        </Box>
      ) : mode === 'delete-confirm' ? (
        <Box
          flexDirection="column"
          borderStyle={compact || !theme.decorated ? undefined : theme.ascii ? 'classic' : 'round'}
          borderColor={theme.danger}
          paddingX={compact ? 0 : 2}
          paddingY={compact ? 0 : 1}
        >
          <Text color={theme.danger} bold>
            Delete{' '}
            {deleteTargets.length === 1
              ? theme.ascii
                ? `"${deleteTargets[0]?.name}"`
                : `“${deleteTargets[0]?.name}”`
              : `${deleteTargets.length} connections`}
            ?
          </Text>
          <Text color={theme.text}>
            {deleteTargets.length === 1
              ? `${deleteTargets[0]?.username}@${deleteTargets[0]?.host}:${deleteTargets[0]?.port}`
              : deleteTargets.map(({ name }) => name).join(', ')}
          </Text>
          <Text color={theme.danger}>
            This permanently removes the connection and stored password.
          </Text>
          {saving ? <Text color={theme.warning}>Deleting{glyphs.ellipsis}</Text> : null}
        </Box>
      ) : (
        <Box flexDirection="row" flexGrow={1} overflow="hidden">
          {responsiveLayout !== 'narrow' || narrowPanel === 'list' ? (
            <Box
              flexDirection="column"
              width={
                responsiveCompact ? '100%' : Math.max(30, Math.min(52, Math.floor(columns * 0.42)))
              }
              borderStyle={
                responsiveCompact || !theme.decorated
                  ? undefined
                  : theme.ascii
                    ? 'classic'
                    : 'single'
              }
              borderTop={false}
              borderBottom={false}
              borderLeft={false}
              borderRight={!responsiveCompact}
              borderColor={theme.border}
              paddingRight={responsiveCompact ? 0 : 2}
              marginRight={responsiveCompact ? 0 : 2}
              overflow="hidden"
            >
              <SearchBar query={query} active={mode === 'search'} />
              {loading ? (
                <Box flexDirection="column">
                  <Text color={theme.accent}>Loading connections{glyphs.ellipsis}</Text>
                  <Text color={theme.muted} dimColor>
                    Reading your local SSH vault
                  </Text>
                </Box>
              ) : error ? (
                <Box flexDirection="column">
                  <Text color={theme.danger} bold>
                    Could not load connections
                  </Text>
                  <Text color={theme.danger}>{error}</Text>
                  <Text color={theme.muted}>Press r to retry.</Text>
                </Box>
              ) : connections.length === 0 && query ? (
                <Box flexDirection="column">
                  <Text color={theme.muted}>
                    No matches for {theme.ascii ? `"${query}"` : `“${query}”`}.
                  </Text>
                  <Text color={theme.muted} dimColor>
                    Backspace to broaden the search, or Esc to clear it.
                  </Text>
                </Box>
              ) : connections.length === 0 ? (
                <Box
                  flexDirection="column"
                  alignItems={responsiveLayout === 'wide' ? 'center' : 'flex-start'}
                  paddingX={responsiveLayout === 'wide' ? 2 : 0}
                >
                  <SshxLogo compact={responsiveLayout !== 'wide'} />
                  <Text color={theme.text} bold>
                    Welcome — add your first SSH connection
                  </Text>
                  <Box flexDirection="column" marginTop={compact ? 0 : 1}>
                    <Text color={theme.text}>
                      <Text color={theme.selected} bold>
                        a
                      </Text>{' '}
                      Add a host manually
                    </Text>
                    <Text color={theme.text}>
                      <Text color={theme.selected} bold>
                        :import
                      </Text>{' '}
                      Import an SSH config or backup
                    </Text>
                    <Text color={theme.text}>
                      <Text color={theme.selected} bold>
                        ?
                      </Text>{' '}
                      Learn the keyboard workflow
                    </Text>
                  </Box>
                  {!compact ? (
                    <Text color={theme.muted}>
                      Tip: sshx import ~/.ssh/config previews entries before saving.
                    </Text>
                  ) : null}
                </Box>
              ) : (
                <ConnectionTree
                  connections={connections}
                  selectedIndex={selectedIndex}
                  selectedIds={selectedIds}
                  maxVisible={maxVisible}
                  compact={compact}
                />
              )}
            </Box>
          ) : null}
          {!loading &&
          !error &&
          selectedConnection &&
          (responsiveLayout !== 'narrow' || narrowPanel === 'detail') ? (
            <Box flexDirection="column" flexGrow={1} overflow="hidden">
              <ConnectionDetail connection={selectedConnection} compact={compact} />
            </Box>
          ) : null}
        </Box>
      )}
    </Frame>
  );
};
