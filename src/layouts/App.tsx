import React, { useState } from 'react';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { SnippetService } from '../services/config/snippet-service.js';
import type { ConnectionHealthService } from '../services/ssh/connection-health-service.js';
import type { ExternalPaletteCommand } from '../services/palette/command-palette.js';
import type { SshConnection } from '../types/connection.js';
import type { KeymapConfig } from '../types/keymap.js';
import type { ResolvedTheme } from '../types/theme.js';
import { MainScreen } from '../screens/MainScreen.js';
import { SnippetManagerScreen } from '../screens/SnippetManagerScreen.js';
import { ThemeProvider } from '../themes/ThemeContext.js';

interface AppProps {
  connectionService: ConnectionService;
  snippetService: SnippetService;
  healthService: ConnectionHealthService;
  keymap: KeymapConfig;
  onPaletteCommand: (command: ExternalPaletteCommand, args: string[]) => Promise<string>;
  onConnect: (connection: SshConnection) => void;
  theme: ResolvedTheme;
}

export const App = ({
  connectionService,
  snippetService,
  healthService,
  keymap,
  onPaletteCommand,
  onConnect,
  theme
}: AppProps): React.ReactElement => {
  const [snippetQuery, setSnippetQuery] = useState<string>();

  return (
    <ThemeProvider theme={theme}>
      {snippetQuery !== undefined ? (
        <SnippetManagerScreen
          service={snippetService}
          initialQuery={snippetQuery}
          onClose={() => setSnippetQuery(undefined)}
        />
      ) : (
        <MainScreen
          connectionService={connectionService}
          healthService={healthService}
          onPaletteCommand={onPaletteCommand}
          onOpenSnippets={setSnippetQuery}
          snippetManagerKey={keymap.snippetManager}
          onConnect={onConnect}
        />
      )}
    </ThemeProvider>
  );
};
