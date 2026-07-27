import { readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packed = spawnSync(npmCommand, ['pack', '--json', '--ignore-scripts'], {
  cwd: new URL('..', import.meta.url),
  encoding: 'utf8',
  shell: process.platform === 'win32'
});

if (packed.error) {
  throw packed.error;
}

if (packed.status !== 0) {
  process.stderr.write(packed.stderr || packed.stdout || 'npm pack failed without output\n');
  process.exit(packed.status ?? 1);
}

let filename;

try {
  const [manifest] = JSON.parse(packed.stdout);
  if (!manifest) throw new Error('npm pack returned no package manifest');
  filename = manifest.filename;
  const files = new Set(manifest.files.map((file) => file.path));
  const required = [
    'package.json',
    'README.md',
    'COMMANDS.md',
    'CHANGELOG.md',
    'ROADMAP.md',
    'THEMES.md',
    'LICENSE',
    packageJson.bin.sshx
  ];
  const missing = required.filter((file) => !files.has(file));
  const testFiles = [...files].filter((file) => /\.test\.[cm]?[jt]sx?$/.test(file));

  if (manifest.version !== packageJson.version) {
    throw new Error(
      `Packed version ${manifest.version} does not match package.json ${packageJson.version}`
    );
  }
  if (missing.length > 0) {
    throw new Error(`Package is missing required files: ${missing.join(', ')}`);
  }
  if (testFiles.length > 0) {
    throw new Error(`Package contains test files: ${testFiles.join(', ')}`);
  }

  process.stdout.write(
    `Verified ${manifest.name}@${manifest.version}: ${manifest.entryCount} files, ${manifest.size} bytes\n`
  );
} finally {
  if (filename) {
    rmSync(new URL(`../${filename}`, import.meta.url), { force: true });
  }
}
