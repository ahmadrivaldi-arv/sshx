import React from 'react';
import { Box } from 'ink';

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
}: FrameProps): React.ReactElement => (
  <Box
    flexDirection="column"
    paddingX={compact ? 1 : 2}
    paddingY={compact ? 0 : 1}
    height={height}
    overflow="hidden"
  >
    {/* Header */}
    <Box
      justifyContent="space-between"
      borderStyle="single"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor="gray"
      paddingBottom={compact ? 0 : 1}
      marginBottom={compact ? 0 : 1}
      flexShrink={0}
    >
      <Box>{title}</Box>
      {subtitle ? <Box>{subtitle}</Box> : null}
    </Box>

    {/* Content */}
    <Box flexDirection="column" flexGrow={1} marginBottom={compact ? 0 : 1} overflow="hidden">
      {children}
    </Box>

    {/* Footer */}
    <Box
      borderStyle="single"
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      borderColor="gray"
      paddingTop={1}
      width="100%"
      flexShrink={0}
      overflow="hidden"
    >
      {footer}
    </Box>
  </Box>
);
