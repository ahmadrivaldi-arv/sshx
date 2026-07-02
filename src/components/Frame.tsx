import React from 'react';
import { Box } from 'ink';

interface FrameProps {
  title: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const Frame = ({ title, children, footer, subtitle }: FrameProps): React.ReactElement => (
  <Box flexDirection="column" paddingX={2} paddingY={1}>
    {/* Header */}
    <Box
      justifyContent="space-between"
      borderStyle="single"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor="gray"
      paddingBottom={1}
      marginBottom={1}
    >
      <Box>{title}</Box>
      {subtitle ? <Box>{subtitle}</Box> : null}
    </Box>

    {/* Content */}
    <Box flexDirection="column" minHeight={12} marginBottom={1}>
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
    >
      {footer}
    </Box>
  </Box>
);
