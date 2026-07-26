import React from 'react';
import { Box, Text } from 'ink';
import type { SshConnection } from '../types/connection.js';

const ACCENT_COLOR = '#f97316'; // Modern Orange Accent

interface ConnectionTreeProps {
  connections: SshConnection[];
  selectedIndex: number;
  maxVisible?: number;
  compact?: boolean;
}

interface GroupedConnections {
  group: string;
  connections: SshConnection[];
}

export const groupConnections = (connections: SshConnection[]): GroupedConnections[] => {
  const groups = new Map<string, SshConnection[]>();

  for (const connection of connections) {
    const group = connection.favorite ? 'Favorites' : (connection.group ?? 'Ungrouped');
    groups.set(group, [...(groups.get(group) ?? []), connection]);
  }

  return [...groups.entries()].map(([group, groupConnectionsValue]) => ({
    group,
    connections: groupConnectionsValue
  }));
};

export const getConnectionTreeItems = (connections: SshConnection[]): SshConnection[] =>
  groupConnections(connections).flatMap((group) => group.connections);

export const ConnectionTree = ({
  connections,
  selectedIndex,
  maxVisible = connections.length,
  compact = false
}: ConnectionTreeProps): React.ReactElement => {
  const treeItems = getConnectionTreeItems(connections);
  const visibleCount = Math.max(maxVisible, 1);
  const maxStart = Math.max(treeItems.length - visibleCount, 0);
  const start = Math.min(Math.max(selectedIndex - Math.floor(visibleCount / 2), 0), maxStart);
  const end = Math.min(start + visibleCount, treeItems.length);
  const visibleIds = new Set(treeItems.slice(start, end).map((connection) => connection.id));
  let cursor = start;
  const groups = groupConnections(connections)
    .map((group) => ({
      ...group,
      connections: group.connections.filter((connection) => visibleIds.has(connection.id))
    }))
    .filter((group) => group.connections.length > 0);

  if (connections.length === 0) {
    return (
      <Box paddingY={compact ? 0 : 1} flexDirection="column">
        <Text color="gray" dimColor>
          No connections yet.
        </Text>
        <Text color={ACCENT_COLOR}>Press a to add your first host.</Text>
      </Box>
    );
  }

  if (maxVisible < 1) {
    return (
      <Box>
        <Text color="gray" dimColor>
          Terminal is too short to show connections.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {start > 0 ? (
        <Text color="gray" dimColor>
          ↑ {start} more
        </Text>
      ) : null}
      {groups.map((group, groupIndex) => (
        <Box
          key={group.group}
          flexDirection="column"
          marginTop={compact || groupIndex === 0 ? 0 : 1}
        >
          <Box marginBottom={compact ? 0 : 1}>
            {group.group === 'Favorites' ? (
              <Text color="yellow" bold dimColor>
                {group.group.toUpperCase()}
                <Text color="gray" dimColor>
                  {' '}
                  ({group.connections.length})
                </Text>
              </Text>
            ) : (
              <Text bold dimColor>
                {group.group.toUpperCase()}
                <Text color="gray" dimColor>
                  {' '}
                  ({group.connections.length})
                </Text>
              </Text>
            )}
          </Box>
          {group.connections.map((connection) => {
            const selected = cursor === selectedIndex;
            cursor += 1;

            return (
              <Box key={connection.id} flexDirection="row" alignItems="center">
                <Text color={selected ? ACCENT_COLOR : 'gray'} bold={selected}>
                  {selected ? '❯ ' : '  '}
                </Text>
                <Box>
                  <Text
                    bold={selected}
                    color={selected ? ACCENT_COLOR : (connection.color ?? 'white')}
                  >
                    {connection.name}
                  </Text>
                </Box>
                {connection.favorite && <Text color="yellow"> ★</Text>}
              </Box>
            );
          })}
        </Box>
      ))}
      {end < treeItems.length ? (
        <Text color="gray" dimColor>
          ↓ {treeItems.length - end} more
        </Text>
      ) : null}
    </Box>
  );
};
