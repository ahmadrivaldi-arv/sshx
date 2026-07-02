import React from 'react';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { SshConnection } from '../types/connection.js';
import { MainScreen } from '../screens/MainScreen.js';

interface AppProps {
  connectionService: ConnectionService;
  onConnect: (connection: SshConnection) => void;
}

export const App = ({ connectionService, onConnect }: AppProps): React.ReactElement => (
  <MainScreen connectionService={connectionService} onConnect={onConnect} />
);
