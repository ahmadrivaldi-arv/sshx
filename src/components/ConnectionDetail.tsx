import React from 'react';
import { Box, Text } from 'ink';
import type { SshConnection } from '../types/connection.js';
import { formatSshOptions } from '../services/ssh/ssh-options.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';

interface ConnectionDetailProps {
  connection?: SshConnection | undefined;
  compact?: boolean;
}

export const ConnectionDetail = ({
  connection,
  compact = false
}: ConnectionDetailProps): React.ReactElement => {
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);

  if (!connection) {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        flexGrow={1}
        height="100%"
      >
        <Text color={theme.muted} dimColor>
          Select a connection to view details
        </Text>
      </Box>
    );
  }

  const formattedDate = connection.lastConnectedAt
    ? new Date(connection.lastConnectedAt).toLocaleString()
    : 'Never';
  const sshOptions = formatSshOptions(connection.sshOptions);
  const connectionSummary =
    connection.connectionCount === 0
      ? 'No sessions'
      : `${connection.connectionCount} session${connection.connectionCount === 1 ? '' : 's'}${
          connection.lastConnectionStatus ? `, last ${connection.lastConnectionStatus}` : ''
        }${
          connection.lastConnectionDurationMs === undefined
            ? ''
            : ` in ${connection.lastConnectionDurationMs}ms`
        }`;
  const healthSummary = connection.healthStatus
    ? `${connection.healthStatus}${
        connection.lastCheckedAt ? ` (${new Date(connection.lastCheckedAt).toLocaleString()})` : ''
      }`
    : 'Not checked';

  if (compact) {
    return (
      <Box flexDirection="column">
        <Text color={theme.accent} bold>
          {connection.name}
          {connection.favorite ? ` ${glyphs.favorite}` : ''}
        </Text>
        <Text color={theme.text}>
          {connection.username}@{connection.host}:{connection.port}
        </Text>
        {connection.group || connection.tags.length > 0 ? (
          <Text color={theme.muted} dimColor>
            {[connection.group, ...connection.tags.map((tag) => `#${tag}`)]
              .filter(Boolean)
              .join(' ')}
          </Text>
        ) : null}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1} flexDirection="row" alignItems="center">
        <Text color={theme.accent} bold>
          {glyphs.brand} {connection.name}
        </Text>
        {connection.favorite && <Text color={theme.favorite}> {glyphs.favorite}</Text>}
      </Box>

      {/* Detail list */}
      <Box flexDirection="column" marginBottom={2}>
        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Host
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{connection.host}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              SSH Options
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{sshOptions || glyphs.empty}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Weak Warning
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>
              {connection.suppressWeakCryptoWarning ? 'Suppressed' : 'Shown'}
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Port
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{connection.port}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Username
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{connection.username}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Key File
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{connection.identityFile ?? glyphs.empty}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Group
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{connection.group ?? glyphs.empty}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Tags
            </Text>
          </Box>
          <Box>
            {connection.tags.length > 0 ? (
              <Text color={theme.accent}>{connection.tags.map((t) => `#${t}`).join(' ')}</Text>
            ) : (
              <Text color={theme.muted} dimColor>
                {glyphs.empty}
              </Text>
            )}
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Last Active
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{formattedDate}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              History
            </Text>
          </Box>
          <Box>
            <Text color={theme.text}>{connectionSummary}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color={theme.muted} dimColor>
              Health
            </Text>
          </Box>
          <Box>
            <Text color={connection.healthStatus === 'online' ? theme.accent : theme.text}>
              {healthSummary}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Launch hint */}
      <Box>
        <Text color={theme.accent} bold>
          {glyphs.launch} Press [Enter] to connect
        </Text>
      </Box>
    </Box>
  );
};
