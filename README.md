# Sshx

A modern terminal SSH manager for managing SSH vaults, hosts, and interactive sessions from a keyboard-driven TUI.

[![npm version](https://img.shields.io/npm/v/%40ahmdrv%2Fsshx?color=%23f97316)](https://www.npmjs.com/package/@ahmdrv/sshx)
[![npm downloads](https://img.shields.io/npm/dm/%40ahmdrv%2Fsshx)](https://www.npmjs.com/package/@ahmdrv/sshx)
[![license](https://img.shields.io/npm/l/%40ahmdrv%2Fsshx)](LICENSE)
[![node](https://img.shields.io/node/v/%40ahmdrv%2Fsshx)](package.json)
[![typescript](https://img.shields.io/badge/TypeScript-strict-3178c6)](tsconfig.json)
[![package](https://img.shields.io/badge/package-%40ahmdrv%2Fsshx-0f172a)](https://github.com/ahmadrivaldi-arv/sshx)

See released changes in [CHANGELOG.md](CHANGELOG.md), the complete
[command reference](COMMANDS.md), the [custom theme guide](THEMES.md), and
planned work in [ROADMAP.md](ROADMAP.md).

## Screenshot

![Sshx terminal UI](screenshots/sshx.png)

## Demo Video

![Demo Video](screenshots/sshx-demo.gif)

[View source video](screenshots/sshx-demo.mp4)

## Features

- Interactive terminal UI for browsing and connecting to SSH hosts.
- Add, edit, delete, duplicate, rename, and favorite connections.
- Realtime search from the TUI with `/`.
- Recent connection tracking with outcome, duration, and session count metadata.
- Import hosts from `~/.ssh/config`.
- Preview and import connections from Sshx JSON/YAML files with duplicate strategies.
- Multi-select connections for bulk delete, favorite, group, and tag actions.
- SSH health checks with online, unreachable, timeout, and authentication-required status.
- Fuzzy `:` command palette for connection and vault operations.
- Versioned full-configuration backup and restore without secret references.
- Versioned configuration migration and cross-platform release verification.
- Export connections to JSON or YAML.
- Native full-screen SSH sessions through `node-pty`, with normal terminal cursor and input behavior.
- Persistent TUI sessions: exiting SSH returns to the connection browser instead of closing Sshx.
- Reusable command snippets with fuzzy search, tags, placeholders, and in-session preview.
- A TUI snippet manager for searching, adding, editing, and deleting snippets.
- Configurable snippet-manager and in-session picker keymaps.
- Per-connection OpenSSH options, including optional weak-crypto warning suppression.
- Responsive compact layout for small terminals (toggle manually with `c`).
- Built-in and externally installed themes, custom accent colors, and persistent compact/ASCII preferences.
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
npm install -g ./ahmdrv-sshx-1.1.0.tgz
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
Space  select connection for bulk actions
g      assign a group to selected connections
t      replace tags on selected connections
h      check selected or multi-selected connection health
H      check all visible connection health
:      open the fuzzy command palette
s      open the snippet manager (configurable)
c      toggle compact layout for the current session
Esc    cancel current mode
q      quit
```

## Commands

The main commands are listed below. See [COMMANDS.md](COMMANDS.md) for every
argument, option, conflict mode, and palette command.

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
sshx backup [options] <file>    Back up the full configuration without secrets
sshx restore [options] <file>   Validate and restore an Sshx backup
sshx snippet <command>          Add, edit, search, or delete command snippets
sshx keymap <command>           Show, configure, or reset keyboard shortcuts
sshx check [options] [target]   Check SSH reachability for one or all connections
sshx connect <target>           Connect by id or exact name
sshx ssh <target>               Alias for connect
sshx logs [options]             Show Sshx log file
sshx theme list                 List built-in and installed themes
sshx theme set <name>           Set theme and display preferences
sshx theme preview <name>       Preview a theme without applying it
sshx theme install <file>       Install an external JSON theme
sshx theme path                 Show the custom theme directory
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

Add OpenSSH options and suppress the weak-crypto warning:

```bash
sshx add "Legacy Server" \
  --host 1.2.3.4 \
  --username root \
  --ssh-option ServerAliveInterval=30 \
  --ssh-option StrictHostKeyChecking=accept-new \
  --suppress-weak-crypto-warning
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

Check SSH health:

```bash
sshx check "Production"
sshx check --all --timeout 3
```

Import from OpenSSH config:

```bash
sshx import
```

Import from Sshx export:

```bash
sshx import --file connections.json
sshx import --file connections.json --strategy overwrite
sshx import --file connections.yaml --strategy rename --apply
sshx import --file backup.txt --format json --apply
```

Imports are preview-only unless `--apply` is provided. Duplicate strategies are
`skip` (default), `overwrite`, and `rename`.

Export:

```bash
sshx export connections.json --format json
sshx export connections.yaml --format yaml
```

Back up and restore:

```bash
sshx backup sshx-backup.json
sshx restore sshx-backup.json --validate-only
sshx restore sshx-backup.json --strategy skip
sshx restore sshx-backup.json --strategy overwrite
sshx restore sshx-backup.json --strategy rename
```

Use `--strategy replace` only when the backup should replace the entire current
vault. Backups include connections, snippets, history, and theme preferences,
but never passwords or password secret references.

Manage command snippets:

```bash
sshx snippet add "Docker logs" \
  --command 'docker logs -f {{container}}' \
  --description "Follow a container's logs" \
  --tags docker,logs
sshx snippet list
sshx snippet list --search dlog
sshx snippet show "Docker logs"
sshx snippet edit "Docker logs" --command 'docker logs --tail 100 -f {{container}}'
sshx snippet delete "Docker logs"
```

Snippets can also be managed entirely inside the TUI. Press `s` from the
connection browser, or run `:snippet` from the command palette. Inside the
manager, use `a` to add, `e` to edit, `d` to delete, and `/` to search.

Like Nano or Vim, SSH temporarily takes over the native terminal while Sshx
remains alive in the background. Press `F2` to open the local snippet picker.
`Ctrl+B`, then `S` is enabled as a prefix alternative; `Ctrl+G`, then `S` and
`Ctrl+]`, then `S` are available as configurable bindings. Search and select a snippet, fill any
`{{placeholder}}` values, then press `I` to insert it without executing or
`X`/`Enter` to insert and execute. Exiting the remote shell returns to the Sshx
connection list.

Configure keymaps:

```bash
sshx keymap
sshx keymap set snippet-picker f2,ctrl-]-s
sshx keymap set snippet-manager n
sshx keymap reset
```

Supported picker bindings are `f2`, `ctrl-b-s`, `ctrl-g-s`, and `ctrl-]-s`.
The snippet-manager binding is one unreserved lowercase letter.

View logs:

```bash
sshx logs
sshx logs -n 200
sshx logs --path
```

Manage themes:

```bash
sshx theme list
sshx theme preview dracula
sshx theme set dracula
sshx theme set nord --accent '#5e81ac' --compact
sshx theme set mono --ascii
sshx theme set default --clear-accent --expanded --unicode
sshx theme install ~/Downloads/ocean.json
sshx theme set ocean --clear-accent
```

Use the command palette:

```text
:add
:edit
:delete
:import connections.json --strategy=rename --apply
:export connections.yaml
:logs
:theme dracula
:snippet docker
```

Available themes are `default`, `minimal`, `mono`, `dracula`, `nord`, `catppuccin`,
and `tokyo-night`, plus JSON themes installed in the user theme directory. Theme
previews do not modify your configuration. See [THEMES.md](THEMES.md) for the
external theme format and sharing instructions.

`default`, `minimal`, and `mono` inherit the terminal foreground/background, so
they work with both light and dark terminal appearances. Named palette themes
such as Dracula and Nord intentionally target dark terminals.

## Configuration

Configuration is stored at:

```text
~/.config/sshx/config.json
```

Example:

```json
{
  "configVersion": 2,
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
      "sshOptions": {
        "ServerAliveInterval": "30"
      },
      "suppressWeakCryptoWarning": false,
      "createdAt": "2026-07-02T00:00:00.000Z",
      "updatedAt": "2026-07-02T00:00:00.000Z"
    }
  ],
  "recentConnectionIds": [],
  "snippets": [
    {
      "id": "uuid",
      "name": "Docker logs",
      "command": "docker logs -f {{container}}",
      "description": "Follow a container's logs",
      "tags": ["docker", "logs"],
      "createdAt": "2026-07-27T00:00:00.000Z",
      "updatedAt": "2026-07-27T00:00:00.000Z"
    }
  ],
  "keymap": {
    "snippetPicker": ["f2", "ctrl-b-s"],
    "snippetManager": "s"
  },
  "theme": {
    "name": "dracula",
    "accentColor": "#bd93f9",
    "compact": false,
    "ascii": false
  }
}
```

Passwords are not stored in `config.json`. Sshx stores only a secret reference and keeps the password in the OS credential store.

`accentColor` is optional and must use `#RRGGBB` format. Compact mode is also
enabled automatically when the terminal is too small for the expanded layout.

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
bun run verify:package
```

## Release

```bash
bun run check
bun run verify:package
```

Pushing a matching version tag runs the release workflow, repeats the checks,
verifies the package contents, and publishes to npm:

```bash
git tag -a v1.1.0 -m "v1.1.0"
git push origin main v1.1.0
```

The published package includes only `dist`, `scripts`, `README.md`, `COMMANDS.md`,
`CHANGELOG.md`, `ROADMAP.md`, `THEMES.md`, and `LICENSE`.
