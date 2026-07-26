import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import packageJson from '../../package.json' with { type: 'json' };
import { ConnectionDetail } from '../components/ConnectionDetail.js';
import { ConnectionTree, getConnectionTreeItems } from '../components/ConnectionTree.js';
import { Frame } from '../components/Frame.js';
import { SearchBar } from '../components/SearchBar.js';
import { useConnections } from '../hooks/useConnections.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import type { ConnectionService } from '../services/config/connection-service.js';
import { formatSshOptions, parseSshOptionsText } from '../services/ssh/ssh-options.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';
import type { ConnectionInput, ConnectionPatch, SshConnection } from '../types/connection.js';

interface MainScreenProps {
  connectionService: ConnectionService;
  onConnect: (connection: SshConnection) => void;
}

type ScreenMode = 'browse' | 'search' | 'add' | 'edit' | 'delete-confirm';

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
  const [deleteTarget, setDeleteTarget] = useState<SshConnection>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const options = useMemo(() => ({ search: query }), [query]);
  const { connections, loading, error, reload } = useConnections(connectionService, options);
  const visibleConnections = useMemo(() => getConnectionTreeItems(connections), [connections]);
  const selectedConnection = visibleConnections[selectedIndex];
  const responsiveCompact = columns < 100 || rows < 24;
  const compact = responsiveCompact || (compactOverride ?? theme.compact);
  const maxVisible = Math.max(Math.floor((rows - (compact ? 11 : 8)) / 2), 1);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(visibleConnections.length - 1, 0)));
  }, [visibleConnections.length]);

  const resetMode = (): void => {
    setMode('browse');
    setForm(emptyForm);
    setFieldIndex(0);
    setEditingId(undefined);
    setDeleteTarget(undefined);
    setSaving(false);
  };

  const connectSelected = (): void => {
    if (selectedConnection) {
      onConnect(selectedConnection);
      app.exit();
    }
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
    if (!deleteTarget || saving) return;

    setSaving(true);
    setMessage('');

    void connectionService
      .delete(deleteTarget.id)
      .then(async () => {
        const deletedName = deleteTarget.name;
        resetMode();
        setQuery('');
        setMessage(`Deleted ${deletedName}`);
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

    if (mode === 'delete-confirm') {
      if (input.toLowerCase() === 'y') {
        deleteConnection();
      } else if (input.toLowerCase() === 'n' || key.return) {
        resetMode();
        setMessage('Delete cancelled');
      }
      return;
    }

    if (input === 'q') {
      app.exit();
    } else if (input === '/') {
      setMode('search');
      setQuery('');
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
      setDeleteTarget(selectedConnection);
      setMode('delete-confirm');
      setMessage('');
    } else if (input === 'f' && selectedConnection) {
      void connectionService
        .toggleFavorite(selectedConnection.id)
        .then(async (connection) => {
          const nextConnections = await reload(options);
          const nextItems = getConnectionTreeItems(nextConnections);
          const nextIndex = nextItems.findIndex((item) => item.id === connection.id);

          if (nextIndex >= 0) setSelectedIndex(nextIndex);
        })
        .catch((caughtError: unknown) => {
          setMessage(
            caughtError instanceof Error ? caughtError.message : 'Failed to update connection'
          );
        });
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
          : mode;

  const footerText =
    mode === 'add' || mode === 'edit'
      ? compact
        ? `${glyphs.up}${glyphs.down} field  ^U clear  ${glyphs.enter} next  ^S save  esc cancel`
        : `${glyphs.up}${glyphs.down}/tab field  ${glyphs.separator}  ctrl+u clear  ${glyphs.separator}  ${glyphs.enter} next  ${glyphs.separator}  ctrl+s save  ${glyphs.separator}  esc cancel`
      : mode === 'delete-confirm'
        ? `y confirm  ${glyphs.separator}  n/esc cancel`
        : mode === 'search'
          ? `${glyphs.up}${glyphs.down} select  ${glyphs.separator}  ${glyphs.enter} connect  ${glyphs.separator}  esc clear/back`
          : compact
            ? `${glyphs.enter} connect  / search  a add  e edit  d delete  q quit`
            : `${glyphs.enter} connect  ${glyphs.separator}  / search  ${glyphs.separator}  a add  ${glyphs.separator}  e edit  ${glyphs.separator}  f fav  ${glyphs.separator}  d delete  ${glyphs.separator}  c compact  ${glyphs.separator}  q quit`;

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
          <Text color={theme.muted}>{footerText}</Text>
          {message ? (
            <Text color={theme.warning}>
              {glyphs.warning} {message}
            </Text>
          ) : null}
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
      ) : mode === 'delete-confirm' ? (
        <Box
          flexDirection="column"
          borderStyle={compact || !theme.decorated ? undefined : theme.ascii ? 'classic' : 'round'}
          borderColor={theme.danger}
          paddingX={compact ? 0 : 2}
          paddingY={compact ? 0 : 1}
        >
          <Text color={theme.danger} bold>
            Delete {theme.ascii ? `"${deleteTarget?.name}"` : `“${deleteTarget?.name}”`}?
          </Text>
          <Text color={theme.text}>
            {deleteTarget?.username}@{deleteTarget?.host}:{deleteTarget?.port}
          </Text>
          <Text color={theme.danger}>
            This permanently removes the connection and stored password.
          </Text>
          {saving ? <Text color={theme.warning}>Deleting{glyphs.ellipsis}</Text> : null}
        </Box>
      ) : (
        <Box flexDirection={compact ? 'column' : 'row'} flexGrow={1} overflow="hidden">
          <Box
            flexDirection="column"
            width={compact ? '100%' : Math.max(30, Math.min(52, Math.floor(columns * 0.42)))}
            borderStyle={
              compact || !theme.decorated ? undefined : theme.ascii ? 'classic' : 'single'
            }
            borderTop={false}
            borderBottom={false}
            borderLeft={false}
            borderRight={!compact}
            borderColor={theme.border}
            paddingRight={compact ? 0 : 2}
            marginRight={compact ? 0 : 2}
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
            ) : (
              <ConnectionTree
                connections={connections}
                selectedIndex={selectedIndex}
                maxVisible={maxVisible}
                compact={compact}
              />
            )}
          </Box>
          {!loading && !error && selectedConnection ? (
            <Box flexDirection="column" flexGrow={1} marginTop={compact ? 1 : 0} overflow="hidden">
              <ConnectionDetail connection={selectedConnection} compact={compact} />
            </Box>
          ) : null}
        </Box>
      )}
    </Frame>
  );
};
