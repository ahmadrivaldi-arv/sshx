import { useCallback, useEffect, useState } from 'react';
import type { ConnectionListOptions, SshConnection } from '../types/connection.js';
import type { ConnectionService } from '../services/config/connection-service.js';

interface UseConnectionsResult {
  connections: SshConnection[];
  loading: boolean;
  error?: string | undefined;
  reload: (options?: ConnectionListOptions) => Promise<void>;
}

export const useConnections = (
  service: ConnectionService,
  options: ConnectionListOptions
): UseConnectionsResult => {
  const [connections, setConnections] = useState<SshConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(
    async (nextOptions: ConnectionListOptions = options): Promise<void> => {
      setLoading(true);
      setError(undefined);

      try {
        setConnections(await service.list(nextOptions));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load connections');
      } finally {
        setLoading(false);
      }
    },
    [options, service]
  );

  useEffect(() => {
    void reload(options);
  }, [options, reload]);

  return { connections, loading, error, reload };
};
