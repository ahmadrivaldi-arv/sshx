import { useEffect, useState } from 'react';
import { useStdout } from 'ink';

export interface TerminalSize {
  columns: number;
  rows: number;
}

const getSize = (stdout: NodeJS.WriteStream): TerminalSize => ({
  columns: stdout.columns || 80,
  rows: stdout.rows || 24
});

export const useTerminalSize = (): TerminalSize => {
  const { stdout } = useStdout();
  const [size, setSize] = useState<TerminalSize>(() => getSize(stdout));

  useEffect(() => {
    const handleResize = (): void => setSize(getSize(stdout));

    stdout.on('resize', handleResize);
    handleResize();

    return (): void => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  return size;
};
