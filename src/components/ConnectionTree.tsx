import React from 'react';
import { Box, Text } from 'ink';
import type { SshConnection } from '../types/connection.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';

interface ConnectionTreeProps {
  connections: SshConnection[];
  selectedIndex: number;
  selectedIds?: ReadonlySet<string>;
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

const healthIndicator = (connection: SshConnection, ascii: boolean): string => {
  if (connection.healthStatus === 'online') return ascii ? 'o' : '●';
  if (connection.healthStatus === 'unreachable') return ascii ? 'x' : '×';
  if (connection.healthStatus === 'timeout') return ascii ? '?' : '◷';
  if (connection.healthStatus === 'auth-required') return '!';
  return '·';
};

export const ConnectionTree = ({
  connections,
  selectedIndex,
  selectedIds = new Set<string>(),
  maxVisible = connections.length,
  compact = false
}: ConnectionTreeProps): React.ReactElement => {
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);
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
        <Text color={theme.muted} dimColor>
          No connections yet.
        </Text>
        <Text color={theme.accent}>Press a to add your first host.</Text>
      </Box>
    );
  }

  if (maxVisible < 1) {
    return (
      <Box>
        <Text color={theme.muted} dimColor>
          Terminal is too short to show connections.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {start > 0 ? (
        <Text color={theme.muted} dimColor>
          {glyphs.up} {start} more
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
              <Text color={theme.favorite} bold dimColor>
                {group.group.toUpperCase()}
                <Text color={theme.muted} dimColor>
                  {' '}
                  ({group.connections.length})
                </Text>
              </Text>
            ) : (
              <Text color={theme.muted} bold dimColor>
                {group.group.toUpperCase()}
                <Text color={theme.muted} dimColor>
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
                <Text color={selected ? theme.selected : theme.muted} bold={selected}>
                  {selected ? `${glyphs.cursor} ` : '  '}
                </Text>
                <Text color={selectedIds.has(connection.id) ? theme.accent : theme.muted}>
                  {selectedIds.has(connection.id) ? '[x] ' : '[ ] '}
                </Text>
                <Box>
                  <Text
                    bold={selected}
                    color={
                      selected
                        ? theme.selected
                        : theme.useConnectionColors
                          ? (connection.color ?? theme.text)
                          : theme.text
                    }
                  >
                    {connection.name}
                  </Text>
                </Box>
                {connection.favorite && <Text color={theme.favorite}> {glyphs.favorite}</Text>}
                <Text color={connection.healthStatus === 'online' ? theme.success : theme.muted}>
                  {' '}
                  {healthIndicator(connection, theme.ascii)}
                </Text>
              </Box>
            );
          })}
        </Box>
      ))}
      {end < treeItems.length ? (
        <Text color={theme.muted} dimColor>
          {glyphs.down} {treeItems.length - end} more
        </Text>
      ) : null}
    </Box>
  );
};
