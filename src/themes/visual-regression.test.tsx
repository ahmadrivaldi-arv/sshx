import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Box, Text } from 'ink';
import { cleanup, render } from 'ink-testing-library';
import { HighlightedCommand } from '../components/HighlightedCommand.js';
import { KeyHints } from '../components/KeyHints.js';
import { SshxLogo } from '../components/SshxLogo.js';
import type { ResolvedTheme } from '../types/theme.js';
import { getResponsiveLayout } from '../utils/responsive-layout.js';
import { ThemeProvider } from './ThemeContext.js';
import { getThemeDefinition, resolveTheme } from './themes.js';

interface VisualFixtureProps {
  columns: number;
  rows: number;
}

const VisualFixture = ({ columns, rows }: VisualFixtureProps): React.ReactElement => {
  const layout = getResponsiveLayout(columns, rows);
  const narrow = layout === 'narrow';

  return (
    <Box flexDirection="column" width={Math.min(columns, 96)}>
      <SshxLogo compact={narrow} />
      <Text>
        {layout} · {columns}x{rows}
      </Text>
      <Box flexDirection={narrow ? 'column' : 'row'}>
        <Box width={narrow ? '100%' : 32}>
          <Text bold>❯ production-api</Text>
        </Box>
        <Box flexDirection="column">
          <Text>deploy command</Text>
          <HighlightedCommand command="deploy --host {{host}} --tag {{version}}" />
        </Box>
      </Box>
      <KeyHints
        compact={narrow}
        hints={[
          { key: 'Enter', label: 'connect' },
          { key: 'T', label: 'themes' },
          { key: '?', label: 'help' }
        ]}
      />
    </Box>
  );
};

const renderFixture = (theme: ResolvedTheme, columns: number, rows: number): string | undefined =>
  render(
    <ThemeProvider theme={theme}>
      <VisualFixture columns={columns} rows={rows} />
    </ThemeProvider>
  ).lastFrame();

afterEach(cleanup);

describe('TUI visual regression', () => {
  it('covers wide dark, medium adaptive, narrow ASCII, and no-color output', () => {
    const dark = resolveTheme(
      { name: 'dracula', compact: false, ascii: false },
      getThemeDefinition('dracula')
    );
    const adaptive = resolveTheme(
      { name: 'default', compact: false, ascii: false },
      getThemeDefinition('default')
    );
    const ascii = resolveTheme(
      { name: 'mono', compact: false, ascii: true },
      getThemeDefinition('mono')
    );
    const noColor = resolveTheme(
      { name: 'dracula', compact: false, ascii: false },
      getThemeDefinition('dracula'),
      { noColor: true }
    );

    expect({
      wideDark: renderFixture(dark, 140, 40),
      mediumAdaptive: renderFixture(adaptive, 96, 24),
      narrowAscii: renderFixture(ascii, 64, 20),
      noColor: renderFixture(noColor, 100, 24)
    }).toMatchSnapshot();
  });
});
