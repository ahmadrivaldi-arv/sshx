import React, { useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { ConnectionTree, getConnectionTreeItems } from '../components/ConnectionTree.js';
import { Frame } from '../components/Frame.js';
import { SearchBar } from '../components/SearchBar.js';
import { ConnectionDetail } from '../components/ConnectionDetail.js';
import { useConnections } from '../hooks/useConnections.js';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionInput, SshConnection } from '../types/connection.js';
import packageJson from '../../package.json' with { type: 'json' };

const ACCENT_COLOR = '#f97316'; // Modern Orange Accent

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
}

interface FormField {
  key: keyof FormState;
  label: string;
  required: boolean;
  masked?: boolean;
}

const fields: FormField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'host', label: 'Host', required: true },
  { key: 'username', label: 'Username', required: true },
  { key: 'port', label: 'Port', required: false },
  { key: 'password', label: 'Password', required: false, masked: true },
  { key: 'identityFile', label: 'Identity file', required: false },
  { key: 'group', label: 'Group', required: false },
  { key: 'tags', label: 'Tags', required: false }
];

const emptyForm: FormState = {
  name: '',
  host: '',
  username: '',
  port: '22',
  password: '',
  identityFile: '',
  group: '',
  tags: ''
};

const createEditForm = (connection: SshConnection): FormState => ({
  name: connection.name,
  host: connection.host,
  username: connection.username,
  port: String(connection.port),
  password: '',
  identityFile: connection.identityFile ?? '',
  group: connection.group ?? '',
  tags: connection.tags.join(', ')
});

const toConnectionInput = (form: FormState): ConnectionInput => ({
  name: form.name.trim(),
  host: form.host.trim(),
  username: form.username.trim(),
  port: Number(form.port.trim() || '22'),
  ...(form.password ? { password: form.password } : {}),
  ...(form.identityFile.trim() ? { identityFile: form.identityFile.trim() } : {}),
  ...(form.group.trim() ? { group: form.group.trim() } : {}),
  tags: form.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
});

export const MainScreen = ({
  connectionService,
  onConnect
}: MainScreenProps): React.ReactElement => {
  const app = useApp();
  const [query, setQuery] = useState<string>('');
  const [mode, setMode] = useState<ScreenMode>('browse');
  const [message, setMessage] = useState<string>('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldIndex, setFieldIndex] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SshConnection | undefined>();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const options = useMemo(() => ({ search: query }), [query]);
  const { connections, loading, error, reload } = useConnections(connectionService, options);
  const visibleConnections = useMemo(() => getConnectionTreeItems(connections), [connections]);
  const selectedConnection = visibleConnections[selectedIndex];

  const resetMode = (): void => {
    setMode('browse');
    setForm(emptyForm);
    setFieldIndex(0);
    setEditingId(undefined);
    setDeleteTarget(undefined);
  };

  const connectSelected = (): void => {
    const selected = selectedConnection;

    if (selected) {
      onConnect(selected);
      app.exit();
    }
  };

  const saveForm = (force = false): void => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const value = form[field.key].trim();

    if (!force && field.required && !value) {
      setMessage(`${field.label} is required`);
      return;
    }

    if (!force && fieldIndex < fields.length - 1) {
      setFieldIndex((current) => current + 1);
      setMessage('');
      return;
    }

    const missingRequiredField = fields.find(
      (candidate) => candidate.required && !form[candidate.key].trim()
    );

    if (missingRequiredField) {
      setFieldIndex(fields.indexOf(missingRequiredField));
      setMessage(`${missingRequiredField.label} is required`);
      return;
    }

    const input = toConnectionInput(form);
    const mutation =
      mode === 'add'
        ? connectionService.add(input)
        : editingId
          ? connectionService.update(editingId, input)
          : Promise.reject(new Error('No connection selected'));

    void mutation
      .then((connection) => {
        setMessage(`${mode === 'add' ? 'Added' : ' Updated'} ${connection.name}`);
        resetMode();
        setSelectedIndex(0);
        return reload(options);
      })
      .catch((caughtError: unknown) => {
        setMessage(
          caughtError instanceof Error ? caughtError.message : 'Failed to save connection'
        );
      });
  };

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'add' || mode === 'edit' || mode === 'delete-confirm' || mode === 'search') {
        resetMode();
        setQuery('');
        setSelectedIndex(0);
      }
      return;
    }

    if (mode === 'search') {
      if (key.return) {
        if (query === 'add') {
          setQuery('');
          setMode('add');
          setForm(emptyForm);
          setFieldIndex(0);
          setMessage('');
          return;
        }

        connectSelected();
      } else if (key.backspace || key.delete) {
        setQuery((current) => current.slice(0, -1));
        setSelectedIndex(0);
      } else if (input) {
        setQuery((current) => `${current}${input}`);
        setSelectedIndex(0);
      }

      return;
    }

    if (mode === 'add' || mode === 'edit') {
      const field = fields[fieldIndex];

      if (!field) {
        return;
      }

      if (key.ctrl && input === 's') {
        saveForm(true);
      } else if (key.return) {
        saveForm();
      } else if (key.backspace || key.delete) {
        setForm((current) => ({
          ...current,
          [field.key]: current[field.key].slice(0, -1)
        }));
      } else if (input) {
        setForm((current) => ({
          ...current,
          [field.key]: `${current[field.key]}${input}`
        }));
      }

      return;
    }

    if (mode === 'delete-confirm') {
      if (input.toLowerCase() === 'y' && deleteTarget) {
        void connectionService.delete(deleteTarget.id).then(() => {
          setMessage(` Deleted ${deleteTarget.name}`);
          resetMode();
          setSelectedIndex(0);
          return reload(options);
        });
      } else if (input.toLowerCase() === 'n' || key.return) {
        setMessage('Delete cancelled');
        resetMode();
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
    } else if (input === 'e') {
      const selected = selectedConnection;

      if (selected) {
        setMode('edit');
        setEditingId(selected.id);
        setForm(createEditForm(selected));
        setFieldIndex(0);
        setMessage('');
      }
    } else if (input === 'd') {
      const selected = selectedConnection;

      if (selected) {
        setDeleteTarget(selected);
        setMode('delete-confirm');
        setMessage('');
      }
    } else if (input === 'f') {
      const selected = selectedConnection;

      if (selected) {
        void connectionService.toggleFavorite(selected.id).then(() => reload(options));
      }
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

  const titleNode = (
    <Box flexDirection="row" alignItems="center">
      <Text color={ACCENT_COLOR} bold>
        ✦ sshx
      </Text>
      <Text color="gray" dimColor>
        {' '}
        v{packageJson.version}
      </Text>
    </Box>
  );

  const subtitleNode = (
    <Text color="gray" dimColor>
      {mode === 'browse'
        ? `${connections.length} connection${connections.length === 1 ? '' : 's'}`
        : mode === 'search'
          ? `search • ${connections.length} found`
          : mode === 'delete-confirm'
            ? 'confirm delete'
            : mode}
    </Text>
  );

  const footerNode = (
    <Box justifyContent="space-between" width="100%">
      <Text color="gray">
        {mode === 'add' || mode === 'edit' ? (
          <>
            <Text color={ACCENT_COLOR} bold>
              ⏎
            </Text>{' '}
            {fieldIndex === fields.length - 1 ? 'save' : 'next'}{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              ctrl+s
            </Text>{' '}
            save{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              esc
            </Text>{' '}
            cancel
          </>
        ) : mode === 'delete-confirm' ? (
          <>
            <Text color="red" bold>
              y
            </Text>{' '}
            confirm{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              n/esc
            </Text>{' '}
            cancel
          </>
        ) : mode === 'search' ? (
          <>
            <Text color={ACCENT_COLOR} bold>
              ⏎
            </Text>{' '}
            connect{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              esc
            </Text>{' '}
            clear/back
          </>
        ) : (
          <>
            <Text color={ACCENT_COLOR} bold>
              ⏎
            </Text>{' '}
            connect{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              /
            </Text>{' '}
            search{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              a
            </Text>{' '}
            add{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              e
            </Text>{' '}
            edit{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              f
            </Text>{' '}
            fav{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              d
            </Text>{' '}
            delete{' '}
            <Text color="gray" dimColor>
              •
            </Text>{' '}
            <Text color={ACCENT_COLOR} bold>
              q
            </Text>{' '}
            quit
          </>
        )}
      </Text>
      {message ? (
        <Text color="yellow" bold>
          ⚠️ {message}
        </Text>
      ) : null}
    </Box>
  );

  return (
    <Frame title={titleNode} subtitle={subtitleNode} footer={footerNode}>
      {mode === 'add' || mode === 'edit' ? (
        <Box flexDirection="column" marginBottom={1}>
          <Box justifyContent="space-between" marginBottom={1}>
            <Text color={ACCENT_COLOR} bold>
              {mode === 'add' ? '✦ Add Connection' : '✦ Edit Connection'}
            </Text>
            <Text color="gray" dimColor>
              {fieldIndex + 1} of {fields.length}
            </Text>
          </Box>
          <Box flexDirection="column">
            {fields.map((field, index) => {
              const value = form[field.key];
              const displayValue = field.masked ? '*'.repeat(value.length) : value;
              const active = index === fieldIndex;

              return (
                <Box key={field.key} flexDirection="row" marginBottom={0.5}>
                  <Text color={active ? ACCENT_COLOR : 'gray'} bold={active}>
                    {active ? '❯ ' : '  '}
                  </Text>
                  <Box width={16}>
                    <Text color={active ? ACCENT_COLOR : 'gray'} bold={active} dimColor={!active}>
                      {field.label}
                    </Text>
                  </Box>
                  <Box>
                    {active ? (
                      <Text color={ACCENT_COLOR}>
                        {displayValue || (field.required ? 'type value...' : 'optional...')}
                        <Text color={ACCENT_COLOR} bold>
                          ▊
                        </Text>
                      </Text>
                    ) : (
                      <Text dimColor>{displayValue || (field.required ? '(required)' : '—')}</Text>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : mode === 'delete-confirm' ? (
        <Box flexDirection="column" marginY={1}>
          <Box marginBottom={1}>
            <Text color="red" bold>
              ⚠️ Delete Connection
            </Text>
          </Box>
          <Box marginBottom={1} paddingLeft={2}>
            <Text>
              Are you sure you want to delete <Text bold>{deleteTarget?.name}</Text> (
              {deleteTarget?.username}@{deleteTarget?.host})?
            </Text>
          </Box>
          <Box paddingLeft={2}>
            <Text color="gray" dimColor>
              This action cannot be undone.
            </Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="row" flexGrow={1} height="100%">
          {/* Left Column: Search & Navigator */}
          <Box
            flexDirection="column"
            width={60}
            borderStyle="single"
            borderTop={false}
            borderBottom={false}
            borderLeft={false}
            borderRight={true}
            borderColor="gray"
            paddingRight={2}
            marginRight={2}
          >
            <SearchBar query={query} active={mode === 'search'} />
            {loading ? (
              <Text color="gray" dimColor>
                Loading...
              </Text>
            ) : error ? (
              <Text color="red">Error</Text>
            ) : (
              <ConnectionTree connections={connections} selectedIndex={selectedIndex} />
            )}
          </Box>

          {/* Right Column: Connection Detail Card */}
          <Box flexDirection="column" flexGrow={1}>
            <ConnectionDetail connection={selectedConnection} />
          </Box>
        </Box>
      )}
    </Frame>
  );
};
