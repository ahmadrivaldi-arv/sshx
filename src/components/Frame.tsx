import React from 'react';
import { Box, Text } from 'ink';

interface FrameProps {
  title: string;
  children: React.ReactNode;
  footer: string;
}

export const Frame = ({ title, children, footer }: FrameProps): React.ReactElement => (
  <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
    <Box
      borderStyle="single"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor="gray"
    >
      <Text bold>{title}</Text>
    </Box>
    <Box flexDirection="column" minHeight={12}>
      {children}
    </Box>
    <Box
      borderStyle="single"
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      borderColor="gray"
    >
      <Text color="gray">{footer}</Text>
    </Box>
  </Box>
);
