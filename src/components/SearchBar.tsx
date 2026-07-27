import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';

interface SearchBarProps {
  query: string;
  active: boolean;
}

export const SearchBar = ({ query, active }: SearchBarProps): React.ReactElement => {
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);

  if (!active && !query) {
    return (
      <Box marginBottom={1}>
        <Text color={theme.muted} dimColor>
          Press{' '}
          <Text bold color={theme.accent}>
            /
          </Text>{' '}
          to search connections...
        </Text>
      </Box>
    );
  }

  return (
    <Box marginBottom={1}>
      <Text color={active ? theme.accent : theme.muted} bold>
        {active ? `${glyphs.cursor} Search: ` : '  Search: '}
      </Text>
      {query ? (
        <Text color={theme.text}>{query}</Text>
      ) : (
        <Text color={theme.muted} dimColor>
          type to filter...
        </Text>
      )}
      {active ? (
        <Text color={theme.accent} bold>
          {glyphs.inputCursor}
        </Text>
      ) : null}
    </Box>
  );
};
