import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';

export interface KeyHint {
  key: string;
  label: string;
}

interface KeyHintsProps {
  hints: readonly KeyHint[];
  compact?: boolean;
  limit?: number | undefined;
}

export const KeyHints = ({ hints, compact = false, limit }: KeyHintsProps): React.ReactElement => {
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);
  const visible = limit === undefined ? hints : hints.slice(0, limit);

  return (
    <Box>
      {visible.map((hint, index) => (
        <React.Fragment key={`${hint.key}-${hint.label}`}>
          {index > 0 ? <Text color={theme.border}> {glyphs.separator} </Text> : null}
          <Text color={theme.selected} bold>
            {hint.key}
          </Text>
          <Text color={theme.muted}> {compact ? hint.label.split(' ')[0] : hint.label}</Text>
        </React.Fragment>
      ))}
    </Box>
  );
};
