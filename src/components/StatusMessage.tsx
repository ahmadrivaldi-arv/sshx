import React from 'react';
import { Text } from 'ink';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';

export type StatusTone = 'info' | 'success' | 'warning' | 'danger';

interface StatusMessageProps {
  message: string;
  tone?: StatusTone;
  busy?: boolean;
}

export const StatusMessage = ({
  message,
  tone = 'info',
  busy = false
}: StatusMessageProps): React.ReactElement | null => {
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);

  if (!message) return null;

  const color =
    tone === 'success'
      ? theme.success
      : tone === 'warning'
        ? theme.warning
        : tone === 'danger'
          ? theme.danger
          : theme.muted;

  return (
    <Text color={color}>
      {busy
        ? `${glyphs.empty} `
        : tone === 'warning' || tone === 'danger'
          ? `${glyphs.warning} `
          : ''}
      {message}
      {busy ? glyphs.ellipsis : ''}
    </Text>
  );
};
