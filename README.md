# Sshx

A modern terminal SSH manager for managing SSH vaults, hosts, and interactive sessions from a keyboard-driven TUI.

## Features

- Interactive terminal UI for browsing and connecting to SSH hosts.
- Add, edit, delete, duplicate, rename, and favorite connections.
- Realtime search from the TUI with `/`.
- Recent connection tracking.
- Import hosts from `~/.ssh/config`.
- Import connections from Sshx JSON/YAML export files.
- Export connections to JSON or YAML.
- Interactive SSH sessions through `node-pty`.
- Secure password storage:
  - macOS: Keychain
  - Linux: Secret Service via `secret-tool`
  - Windows: DPAPI for the current user
- Log viewer for Sshx runtime logs.

## Install

```bash
npm install -g @ahmdrv/sshx
sshx
```

For a local production-style install from this repository:

```bash
bun install
bun run build
npm pack
npm install -g ./ahmdrv-sshx-0.3.0.tgz
sshx
```

During development:

```bash
bun install
bun run dev
```

## Usage

Open the TUI:

```bash
sshx
```

Show help:

```bash
sshx --help
```

Show version:

```bash
sshx --version
```

## TUI Shortcuts

```text
Enter  connect to selected host
/      search, or type /add to add from search mode
a      add connection
e      edit selected connection
Ctrl+S save immediately while adding/editing
d      delete selected connection with confirmation
f      toggle favorite
Esc    cancel current mode
q      quit
```

## Commands

```text
sshx add [options] <name>       Add a new SSH connection
sshx edit [options] <id>        Edit an SSH connection by id
sshx list [options]             List configured SSH connections
sshx delete <id>                Delete an SSH connection by id
sshx duplicate <id>             Duplicate an SSH connection by id
sshx rename <id> <name>         Rename an SSH connection by id
sshx favorite <id>              Toggle favorite status by id
sshx import [options]           Import connections from ~/.ssh/config or Sshx JSON/YAML export
sshx export [options] <file>    Export connections to JSON or YAML
sshx connect <target>           Connect by id or exact name
sshx ssh <target>               Alias for connect
sshx logs [options]             Show Sshx log file
```

## Examples

Add a password-based connection:

```bash
export SSHX_PASSWORD='server-password'
sshx add "Production" \
  --host 1.2.3.4 \
  --username root \
  --port 22 \
  --group Production \
  --tags Laravel,Ubuntu \
  --password-env SSHX_PASSWORD
unset SSHX_PASSWORD
```

Add a key-based connection:

```bash
sshx add "Web-01" \
  --host 1.2.3.4 \
  --username root \
  --identity-file ~/.ssh/id_ed25519 \
  --group Production
```

List connections:

```bash
sshx list
```

Search from the CLI:

```bash
sshx list --search prod
```

Connect:

```bash
sshx connect "Production"
```

Import from OpenSSH config:

```bash
sshx import
```

Import from Sshx export:

```bash
sshx import --file connections.json
sshx import --file connections.yaml
sshx import --file backup.txt --format json
```

Export:

```bash
sshx export connections.json --format json
sshx export connections.yaml --format yaml
```

View logs:

```bash
sshx logs
sshx logs -n 200
sshx logs --path
```

## Configuration

Configuration is stored at:

```text
~/.config/sshx/config.json
```

Example:

```json
{
  "connections": [
    {
      "id": "uuid",
      "name": "Production",
      "host": "1.2.3.4",
      "port": 22,
      "username": "root",
      "identityFile": "~/.ssh/id_ed25519",
      "group": "Production",
      "tags": ["Laravel", "Ubuntu"],
      "color": "red",
      "favorite": true,
      "createdAt": "2026-07-02T00:00:00.000Z",
      "updatedAt": "2026-07-02T00:00:00.000Z"
    }
  ],
  "recentConnectionIds": []
}
```

Passwords are not stored in `config.json`. Sshx stores only a secret reference and keeps the password in the OS credential store.

## Requirements

- Node.js 20 or newer.
- OpenSSH client available on `PATH`.
- Bun is only required for development and release builds.

On Linux, install `secret-tool` first. For example, Debian/Ubuntu:

```bash
sudo apt install libsecret-tools
```

## Development

```bash
bun install
bun run dev
bun run check
```

## Release

```bash
bun run check
npm pack --dry-run
npm publish --access public
```

The published package includes only `dist`, `scripts`, `README.md`, and `LICENSE`.
