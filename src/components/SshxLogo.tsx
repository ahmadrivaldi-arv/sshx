import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/ThemeContext.js';

const unicodeLogo = [
  '███████╗███████╗██╗  ██╗██╗  ██╗',
  '██╔════╝██╔════╝██║  ██║╚██╗██╔╝',
  '███████╗███████╗███████║ ╚███╔╝ ',
  '╚════██║╚════██║██╔══██║ ██╔██╗ ',
  '███████║███████║██║  ██║██╔╝ ██╗',
  '╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝'
];
const asciiLogo = [
  '  ____ ____  _   _ __  __',
  ' / ___/ ___|| | | |\\ \\/ /',
  ' \\___ \\___ \\| |_| | \\  / ',
  '  ___) |__) |  _  | /  \\ ',
  ' |____/____/|_| |_|/_/\\_\\'
];

interface SshxLogoProps {
  compact?: boolean;
}

export const SshxLogo = ({ compact = false }: SshxLogoProps): React.ReactElement => {
  const theme = useTheme();
  const lines = theme.ascii ? asciiLogo : unicodeLogo;

  if (compact) {
    return (
      <Text color={theme.accent} bold>
        sshx
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      {lines.map((line) => (
        <Text key={line} color={theme.accent} bold>
          {line}
        </Text>
      ))}
    </Box>
  );
};
