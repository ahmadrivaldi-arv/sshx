import React, { useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { ConnectionTree } from '../components/ConnectionTree.js';
import { Frame } from '../components/Frame.js';
import { SearchBar } from '../components/SearchBar.js';
import { useConnections } from '../hooks/useConnections.js';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionInput, SshConnection } from '../types/connection.js';

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

  const resetMode = (): void => {
    setMode('browse');
    setForm(emptyForm);
    setFieldIndex(0);
    setEditingId(undefined);
    setDeleteTarget(undefined);
  };

  const connectSelected = (): void => {
    const selected = connections[selectedIndex];

    if (selected) {
      onConnect(selected);
      app.exit();
    }
  };

  const saveForm = (): void => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const value = form[field.key].trim();

    if (field.required && !value) {
      setMessage(`${field.label} is required`);
      return;
    }

    if (fieldIndex < fields.length - 1) {
      setFieldIndex((current) => current + 1);
      setMessage('');
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
        setMessage(`${mode === 'add' ? 'Added' : 'Updated'} ${connection.name}`);
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
      setQuery('');
      resetMode();
      setSelectedIndex(0);
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

      if (key.return) {
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
          setMessage(`Deleted ${deleteTarget.name}`);
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
      const selected = connections[selectedIndex];

      if (selected) {
        setMode('edit');
        setEditingId(selected.id);
        setForm(createEditForm(selected));
        setFieldIndex(0);
        setMessage('');
      }
    } else if (input === 'd') {
      const selected = connections[selectedIndex];

      if (selected) {
        setDeleteTarget(selected);
        setMode('delete-confirm');
        setMessage('');
      }
    } else if (input === 'f') {
      const selected = connections[selectedIndex];

      if (selected) {
        void connectionService.toggleFavorite(selected.id).then(() => reload(options));
      }
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((current) => Math.min(current + 1, Math.max(connections.length - 1, 0)));
    } else if (key.upArrow || input === 'k') {
      setSelectedIndex((current) => Math.max(current - 1, 0));
    } else if (key.return) {
      connectSelected();
    }
  });

  return (
    <Frame title="Sshx" footer="Enter Connect | / Search | a Add | e Edit | d Delete | q Quit">
      {mode === 'search' ? (
        <Box marginY={1}>
          <Text color="cyan">Search: /</Text>
          <Text>{query}</Text>
          <Text color="cyan">_</Text>
        </Box>
      ) : mode === 'add' || mode === 'edit' ? (
        <Box flexDirection="column" marginY={1}>
          <Text color="cyan">{mode === 'add' ? 'Add connection' : 'Edit connection'}</Text>
          {fields.map((field, index) => {
            const value = form[field.key];
            const displayValue = field.masked ? '*'.repeat(value.length) : value;
            const active = index === fieldIndex;

            return (
              <Text key={field.key} color={active ? 'cyan' : 'gray'}>
                {active ? '›' : ' '} {field.label}: {displayValue}
                {active ? '_' : ''}
              </Text>
            );
          })}
        </Box>
      ) : mode === 'delete-confirm' ? (
        <Box marginY={1}>
          <Text color="red">Delete {deleteTarget?.name}? </Text>
          <Text color="gray">y confirm, n cancel</Text>
        </Box>
      ) : (
        <SearchBar query={query} active={false} />
      )}
      {message ? <Text color="yellow">{message}</Text> : null}
      {loading ? (
        <Text color="gray">Loading connections...</Text>
      ) : error ? (
        <Text color="red">{error}</Text>
      ) : (
        <Box flexDirection="column">
          <ConnectionTree connections={connections} selectedIndex={selectedIndex} />
          <Box marginTop={1}>
            <Text color="gray">{connections.length} connection(s)</Text>
          </Box>
        </Box>
      )}
    </Frame>
  );
};
