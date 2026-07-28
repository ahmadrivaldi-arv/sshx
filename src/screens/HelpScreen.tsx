import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Frame } from '../components/Frame.js';
import { KeyHints } from '../components/KeyHints.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getResponsiveLayout } from '../utils/responsive-layout.js';

export type HelpContext = 'connections' | 'snippets' | 'themes';

interface HelpScreenProps {
  context: HelpContext;
  onClose: () => void;
  onAbout: () => void;
}

const helpRows: Record<HelpContext, Array<[string, string]>> = {
  connections: [
    ['↑/↓ or j/k', 'Move between connections'],
    ['Enter', 'Start a native SSH session'],
    ['/', 'Search connections'],
    [':', 'Open the command palette'],
    ['Space', 'Select connections for bulk actions'],
    ['a / e / d', 'Add, edit, or delete'],
    ['s', 'Open the snippet manager'],
    ['T', 'Browse installed themes']
  ],
  snippets: [
    ['↑/↓ or j/k', 'Move between snippets'],
    ['/', 'Search snippets'],
    ['a / e / d', 'Add, edit, or delete'],
    ['Ctrl+S', 'Save a snippet form'],
    ['Esc', 'Cancel or return to connections']
  ],
  themes: [
    ['↑/↓ or j/k', 'Preview a theme temporarily'],
    ['Enter', 'Choose how to apply it'],
    ['Esc', 'Restore the previous theme'],
    ['CLI', 'sshx theme install ./theme.json']
  ]
};

export const HelpScreen = ({ context, onClose, onAbout }: HelpScreenProps): React.ReactElement => {
  const theme = useTheme();
  const { columns, rows } = useTerminalSize();
  const compact = getResponsiveLayout(columns, rows) === 'narrow';

  useInput((input, key) => {
    if (key.escape || input === 'q' || input === '?') onClose();
    else if (input.toLowerCase() === 'a') onAbout();
  });

  return (
    <Frame
      title={
        <Text color={theme.accent} bold>
          Help
        </Text>
      }
      subtitle={!compact ? <Text color={theme.muted}>{context}</Text> : undefined}
      footer={
        <KeyHints
          compact={compact}
          hints={[
            { key: 'a', label: 'about sshx' },
            { key: 'Esc', label: 'go back' }
          ]}
        />
      }
      compact={compact}
      height={rows}
    >
      <Box flexDirection="column">
        <Text color={theme.text} bold>
          {context === 'connections'
            ? 'Connections'
            : context === 'snippets'
              ? 'Snippet manager'
              : 'Theme picker'}
        </Text>
        {helpRows[context].map(([key, description]) => (
          <Box key={key} marginTop={compact ? 0 : 1}>
            <Box width={compact ? 15 : 22}>
              <Text color={theme.selected} bold>
                {key}
              </Text>
            </Box>
            <Text color={theme.text}>{description}</Text>
          </Box>
        ))}
        {!compact ? (
          <Box marginTop={1} flexDirection="column">
            <Text color={theme.muted}>Commands and documentation</Text>
            <Text color={theme.text}>sshx --help · sshx &lt;command&gt; --help</Text>
            <Text color={theme.accent}>https://github.com/ahmadrivaldi-arv/sshx</Text>
          </Box>
        ) : null}
      </Box>
    </Frame>
  );
};
