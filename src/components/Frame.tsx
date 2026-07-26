import React from 'react';
import { Box } from 'ink';
import { useTheme } from '../themes/ThemeContext.js';

const asciiBorderStyle = {
  top: '-',
  bottom: '-',
  left: '|',
  right: '|',
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+'
} as const;

interface FrameProps {
  title: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  subtitle?: React.ReactNode;
  compact?: boolean;
  height?: number;
}

export const Frame = ({
  title,
  children,
  footer,
  subtitle,
  compact = false,
  height
}: FrameProps): React.ReactElement => {
  const theme = useTheme();
  const borderStyle = theme.ascii ? asciiBorderStyle : 'single';

  return (
    <Box
      flexDirection="column"
      paddingX={compact ? 1 : 2}
      paddingY={compact ? 0 : 1}
      height={height}
      overflow="hidden"
    >
      <Box
        justifyContent="space-between"
        borderStyle={theme.decorated ? borderStyle : undefined}
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderColor={theme.border}
        paddingBottom={compact ? 0 : 1}
        marginBottom={compact ? 0 : 1}
        flexShrink={0}
      >
        <Box>{title}</Box>
        {subtitle ? <Box>{subtitle}</Box> : null}
      </Box>

      <Box flexDirection="column" flexGrow={1} marginBottom={compact ? 0 : 1} overflow="hidden">
        {children}
      </Box>

      <Box
        borderStyle={theme.decorated ? borderStyle : undefined}
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        borderColor={theme.border}
        paddingTop={theme.decorated ? 1 : 0}
        width="100%"
        flexShrink={0}
        overflow="hidden"
      >
        {footer}
      </Box>
    </Box>
  );
};
