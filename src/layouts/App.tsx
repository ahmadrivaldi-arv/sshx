import React from 'react';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { ConnectionHealthService } from '../services/ssh/connection-health-service.js';
import type { SshConnection } from '../types/connection.js';
import type { ResolvedTheme } from '../types/theme.js';
import { MainScreen } from '../screens/MainScreen.js';
import { ThemeProvider } from '../themes/ThemeContext.js';

interface AppProps {
  connectionService: ConnectionService;
  healthService: ConnectionHealthService;
  onConnect: (connection: SshConnection) => void;
  theme: ResolvedTheme;
}

export const App = ({
  connectionService,
  healthService,
  onConnect,
  theme
}: AppProps): React.ReactElement => (
  <ThemeProvider theme={theme}>
    <MainScreen
      connectionService={connectionService}
      healthService={healthService}
      onConnect={onConnect}
    />
  </ThemeProvider>
);
