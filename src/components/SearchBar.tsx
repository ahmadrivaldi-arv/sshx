import React from 'react';
import { Box, Text } from 'ink';

const ACCENT_COLOR = '#f97316'; // Modern Orange Accent

interface SearchBarProps {
  query: string;
  active: boolean;
}

export const SearchBar = ({ query, active }: SearchBarProps): React.ReactElement => {
  if (!active && !query) {
    return (
      <Box marginBottom={1}>
        <Text color="gray" dimColor>
          Press{' '}
          <Text bold color={ACCENT_COLOR}>
            /
          </Text>{' '}
          to search connections...
        </Text>
      </Box>
    );
  }

  return (
    <Box marginBottom={1}>
      <Text color={active ? ACCENT_COLOR : 'gray'} bold>
        {active ? '❯ Search: ' : '  Search: '}
      </Text>
      {query ? (
        <Text>{query}</Text>
      ) : (
        <Text color="gray" dimColor>
          type to filter...
        </Text>
      )}
      {active ? (
        <Text color={ACCENT_COLOR} bold>
          ▊
        </Text>
      ) : null}
    </Box>
  );
};
