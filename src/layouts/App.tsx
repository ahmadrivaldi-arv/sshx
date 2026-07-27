import React from 'react';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionHealthService } from '../services/ssh/connection-health-service.js';
import type { ExternalPaletteCommand } from '../services/palette/command-palette.js';
import type { SshConnection } from '../types/connection.js';
import type { ResolvedTheme } from '../types/theme.js';
import { MainScreen } from '../screens/MainScreen.js';
import { ThemeProvider } from '../themes/ThemeContext.js';

interface AppProps {
  connectionService: ConnectionService;
  healthService: ConnectionHealthService;
  onPaletteCommand: (command: ExternalPaletteCommand, args: string[]) => Promise<string>;
  onConnect: (connection: SshConnection) => void;
  theme: ResolvedTheme;
}

export const App = ({
  connectionService,
  healthService,
  onPaletteCommand,
  onConnect,
  theme
}: AppProps): React.ReactElement => (
  <ThemeProvider theme={theme}>
    <MainScreen
      connectionService={connectionService}
      healthService={healthService}
      onPaletteCommand={onPaletteCommand}
      onConnect={onConnect}
    />
  </ThemeProvider>
);
