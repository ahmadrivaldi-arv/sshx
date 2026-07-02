import React from 'react';
import { Box, Text } from 'ink';
import type { SshConnection } from '../types/connection.js';

const ACCENT_COLOR = '#f97316'; // Modern Orange Accent

interface ConnectionDetailProps {
  connection?: SshConnection | undefined;
}

export const ConnectionDetail = ({ connection }: ConnectionDetailProps): React.ReactElement => {
  if (!connection) {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        flexGrow={1}
        height="100%"
      >
        <Text color="gray" dimColor>
          Select a connection to view details
        </Text>
      </Box>
    );
  }

  const formattedDate = connection.lastConnectedAt
    ? new Date(connection.lastConnectedAt).toLocaleString()
    : 'Never';

  return (
    <Box flexDirection="column" paddingX={2} flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1} flexDirection="row" alignItems="center">
        <Text color={ACCENT_COLOR} bold>
          ✦ {connection.name}
        </Text>
        {connection.favorite && <Text color="yellow"> ★</Text>}
      </Box>

      {/* Detail list */}
      <Box flexDirection="column" marginBottom={2}>
        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color="gray" dimColor>
              Host
            </Text>
          </Box>
          <Box>
            <Text>{connection.host}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color="gray" dimColor>
              Port
            </Text>
          </Box>
          <Box>
            <Text>{connection.port}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color="gray" dimColor>
              Username
            </Text>
          </Box>
          <Box>
            <Text>{connection.username}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color="gray" dimColor>
              Key File
            </Text>
          </Box>
          <Box>
            <Text>{connection.identityFile ?? '—'}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color="gray" dimColor>
              Group
            </Text>
          </Box>
          <Box>
            <Text>{connection.group ?? '—'}</Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color="gray" dimColor>
              Tags
            </Text>
          </Box>
          <Box>
            {connection.tags.length > 0 ? (
              <Text color={ACCENT_COLOR}>{connection.tags.map((t) => `#${t}`).join(' ')}</Text>
            ) : (
              <Text color="gray" dimColor>
                —
              </Text>
            )}
          </Box>
        </Box>

        <Box flexDirection="row" marginBottom={0.5}>
          <Box width={14}>
            <Text color="gray" dimColor>
              Last Active
            </Text>
          </Box>
          <Box>
            <Text>{formattedDate}</Text>
          </Box>
        </Box>
      </Box>

      {/* Launch hint */}
      <Box>
        <Text color={ACCENT_COLOR} bold>
          ⚡ Press [Enter] to connect
        </Text>
      </Box>
    </Box>
  );
};
