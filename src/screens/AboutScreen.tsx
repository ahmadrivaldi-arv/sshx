import React from 'react';
import { Box, Text, useInput } from 'ink';
import packageJson from '../../package.json' with { type: 'json' };
import { Frame } from '../components/Frame.js';
import { KeyHints } from '../components/KeyHints.js';
import { SshxLogo } from '../components/SshxLogo.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getResponsiveLayout } from '../utils/responsive-layout.js';

interface AboutScreenProps {
  onClose: () => void;
}

const details: Array<[string, string]> = [
  ['Repository', 'https://github.com/ahmadrivaldi-arv/sshx'],
  ['Documentation', 'https://github.com/ahmadrivaldi-arv/sshx#readme'],
  ['npm', 'https://www.npmjs.com/package/@ahmdrv/sshx'],
  ['License', 'MIT']
];

export const AboutScreen = ({ onClose }: AboutScreenProps): React.ReactElement => {
  const theme = useTheme();
  const { columns, rows } = useTerminalSize();
  const compact = getResponsiveLayout(columns, rows) === 'narrow';

  useInput((input, key) => {
    if (key.escape || input === 'q') onClose();
  });

  return (
    <Frame
      title={
        <Text color={theme.accent} bold>
          About sshx
        </Text>
      }
      footer={<KeyHints hints={[{ key: 'Esc', label: 'go back' }]} />}
      compact={compact}
      height={rows}
    >
      <Box flexDirection="column" alignItems={compact ? 'flex-start' : 'center'}>
        <SshxLogo compact={compact || columns < 90 || rows < 24} />
        <Box flexDirection="column" marginTop={compact ? 0 : 1}>
          <Text color={theme.text} bold>
            Native SSH, modern workflow.
          </Text>
          <Text color={theme.muted}>
            v{packageJson.version} · active theme: {theme.name}
          </Text>
        </Box>
        <Box flexDirection="column" marginTop={compact ? 1 : 2} width="100%">
          {details.map(([label, value]) => (
            <Box key={label}>
              <Box width={compact ? 14 : 18}>
                <Text color={theme.muted}>{label}</Text>
              </Box>
              <Text color={label === 'License' ? theme.text : theme.accent}>{value}</Text>
            </Box>
          ))}
          <Box marginTop={1}>
            <Box width={compact ? 14 : 18}>
              <Text color={theme.muted}>Update</Text>
            </Box>
            <Text color={theme.success}>npm install -g @ahmdrv/sshx@latest</Text>
          </Box>
        </Box>
      </Box>
    </Frame>
  );
};
