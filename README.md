# Sshx

A lightweight, keyboard-driven SSH manager that runs entirely in the terminal.

## Commands

```bash
bun install
bun run dev
bun run build
bun run test
```

Configuration is stored at `~/.config/sshx/config.json` on macOS/Linux.

## Install

After the package is published to npm:

```bash
npm install -g @ahmdrv/sshx
sshx
```

For a local production-style install from this repository:

```bash
bun install
bun run build
npm pack
npm install -g ./ahmdrv-sshx-0.1.0.tgz
sshx
```

You can also install from a cloned repository during development:

```bash
bun install
bun run build
npm link
sshx
```

## Release Checklist

```bash
bun run check
npm pack --dry-run
npm publish --access public
```

The published package includes only `dist`, `scripts`, `README.md`, and `LICENSE`.

## Requirements

- Node.js 20 or newer.
- OpenSSH client available on `PATH`.
- Bun is only required for development and release builds, not for users installing the published package.

## Platform Support

- macOS: passwords are stored in Keychain.
- Linux: passwords are stored through Secret Service using `secret-tool` from libsecret.
- Windows: passwords are encrypted with the current user's DPAPI and stored under the app config directory.

On Linux, install `secret-tool` first. For example, Debian/Ubuntu:

```bash
sudo apt install libsecret-tools
```
