import React from 'react';
import { Text } from 'ink';
import { useTheme } from '../themes/ThemeContext.js';

interface HighlightedCommandProps {
  command: string;
}

export const splitCommandPlaceholders = (
  command: string
): Array<{ text: string; placeholder: boolean }> =>
  command
    .split(/(\{\{[^{}\n]+\}\})/g)
    .filter(Boolean)
    .map((text) => ({ text, placeholder: /^\{\{[^{}\n]+\}\}$/.test(text) }));

export const HighlightedCommand = ({ command }: HighlightedCommandProps): React.ReactElement => {
  const theme = useTheme();

  return (
    <Text color={theme.text} wrap="truncate">
      {splitCommandPlaceholders(command).map((part, index) => (
        <Text
          key={`${index}-${part.text}`}
          color={part.placeholder ? theme.selected : theme.text}
          bold={part.placeholder}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};
