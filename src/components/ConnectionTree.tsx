import React from 'react';
import { Box, Text } from 'ink';
import type { SshConnection } from '../types/connection.js';

const ACCENT_COLOR = '#f97316'; // Modern Orange Accent

interface ConnectionTreeProps {
  connections: SshConnection[];
  selectedIndex: number;
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
  selectedIndex
}: ConnectionTreeProps): React.ReactElement => {
  let cursor = 0;
  const groups = groupConnections(connections);

  if (connections.length === 0) {
    return (
      <Box paddingY={1}>
        <Text color="gray" dimColor>
          No connections found. Press 'a' to add one.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {groups.map((group, groupIndex) => (
        <Box
          key={group.group}
          flexDirection="column"
          marginTop={groupIndex === 0 ? 0 : 1}
        >
          <Box marginBottom={1}>
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
    </Box>
  );
};
