import React from 'react';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { SshConnection } from '../types/connection.js';
import type { ResolvedTheme } from '../types/theme.js';
import { MainScreen } from '../screens/MainScreen.js';
import { ThemeProvider } from '../themes/ThemeContext.js';

interface AppProps {
  connectionService: ConnectionService;
  onConnect: (connection: SshConnection) => void;
  theme: ResolvedTheme;
}

export const App = ({ connectionService, onConnect, theme }: AppProps): React.ReactElement => (
  <ThemeProvider theme={theme}>
    <MainScreen connectionService={connectionService} onConnect={onConnect} />
  </ThemeProvider>
);
