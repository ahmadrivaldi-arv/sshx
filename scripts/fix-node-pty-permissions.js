import fs from 'node:fs/promises';
import path from 'node:path';

const executablePaths = [
  path.join('node_modules', 'node-pty', 'prebuilds', 'darwin-arm64', 'spawn-helper'),
  path.join('node_modules', 'node-pty', 'prebuilds', 'darwin-x64', 'spawn-helper'),
  path.join('node_modules', 'node-pty', 'prebuilds', 'linux-arm64', 'spawn-helper'),
  path.join('node_modules', 'node-pty', 'prebuilds', 'linux-x64', 'spawn-helper')
];

for (const executablePath of executablePaths) {
  try {
    await fs.chmod(executablePath, 0o755);
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;

    if (code !== 'ENOENT') {
      throw error;
    }
  }
}
