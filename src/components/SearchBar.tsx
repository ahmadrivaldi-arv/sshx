import React from 'react';
import { Box, Text } from 'ink';

interface SearchBarProps {
  query: string;
  active: boolean;
}

export const SearchBar = ({ query, active }: SearchBarProps): React.ReactElement => (
  <Box marginY={1}>
    <Text color={active ? 'cyan' : 'gray'}>Search: </Text>
    <Text>{query || (active ? '' : 'press /')}</Text>
    {active ? <Text color="cyan">_</Text> : null}
  </Box>
);
