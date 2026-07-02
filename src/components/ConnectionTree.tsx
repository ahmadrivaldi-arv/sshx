import React from 'react';
import { Box, Text } from 'ink';
import type { SshConnection } from '../types/connection.js';

interface ConnectionTreeProps {
  connections: SshConnection[];
  selectedIndex: number;
}

interface GroupedConnections {
  group: string;
  connections: SshConnection[];
}

const groupConnections = (connections: SshConnection[]): GroupedConnections[] => {
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

export const ConnectionTree = ({
  connections,
  selectedIndex
}: ConnectionTreeProps): React.ReactElement => {
  let cursor = 0;
  const groups = groupConnections(connections);

  if (connections.length === 0) {
    return (
      <Box>
        <Text color="gray">No connections found.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {groups.map((group) => (
        <Box key={group.group} flexDirection="column" marginBottom={1}>
          <Text color={group.group === 'Favorites' ? 'yellow' : 'white'} bold>
            {group.group === 'Favorites' ? '* ' : ''}
            {group.group}
          </Text>
          {group.connections.map((connection) => {
            const selected = cursor === selectedIndex;
            cursor += 1;

            return (
              <Text key={connection.id} color={selected ? 'cyan' : (connection.color ?? 'white')}>
                {selected ? '›' : ' '} • {connection.name}{' '}
                <Text color="gray">{connection.host}</Text>
              </Text>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};
