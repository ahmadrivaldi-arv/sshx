# Roadmap

This roadmap tracks the next planned work for Sshx. Scope may change as the project matures, but the priority is to keep the core SSH manager fast, stable, and pleasant to use before adding larger post-v1 features.

## v0.4.0 - TUI Polish & Reliability

Focus: make the current TUI more stable, readable, and comfortable across terminal sizes.

- [x] Fix terminal redraw issues on small terminal sizes.
- [x] Improve add, edit, and delete flows.
- [x] Add compact layout mode.
- [x] Improve delete confirmation UI.
- [x] Improve empty, error, and loading states.
- [x] Add configurable SSH options per connection.
- [x] Add option to suppress OpenSSH weak crypto warning:
  - `WarnWeakCrypto=no`

## v0.5.0 - Themes

Focus: allow users to customize the look and terminal compatibility.

- [x] Add theme config to `config.json`.
- [x] Add built-in themes:
  - default
  - minimal
  - mono
  - dracula
  - nord
  - catppuccin
  - tokyo-night
- [x] Add custom accent color.
- [x] Add compact mode.
- [x] Add ASCII mode for terminals with poor Unicode support.
- [x] Add theme commands:
  - `sshx theme list`
  - `sshx theme set <name>`
  - `sshx theme preview <name>`

## v0.6.0 - Import & Vault Management

Focus: make Sshx better for managing many connections.

- [x] Add import preview before saving.
- [x] Add duplicate detection during add/import.
- [x] Add skip, overwrite, or rename strategy for duplicates.
- [x] Add bulk actions:
  - [x] multi-select
  - [x] delete multiple
  - [x] favorite multiple
  - [x] assign group
  - [x] assign tags
- [x] Add better recent connection metadata.

## v0.7.0 - Connection Health

Focus: help users know whether servers are reachable before connecting.

- [x] Add SSH port health check.
- [x] Add status indicators:
  - [x] online
  - [x] unreachable
  - [x] timeout
  - [x] auth required
- [x] Add shortcut to check selected connection.
- [x] Add bulk health check for visible connections.
- [x] Store last checked timestamp.

## v0.8.0 - Command Palette

Focus: make Sshx faster for keyboard-heavy users.

- [x] Add command palette with `:`.
- [x] Support commands:
  - [x] `:add`
  - [x] `:edit`
  - [x] `:delete`
  - [x] `:import`
  - [x] `:export`
  - [x] `:logs`
  - [x] `:theme`
- [x] Add fuzzy command matching.
- [x] Add command hints in footer.

## v0.9.0 - Backup & Restore

Focus: safer migration and recovery.

- [x] Add `sshx backup`.
- [x] Add `sshx restore`.
- [x] Export full config without secrets.
- [x] Validate backup before restore.
- [x] Add restore conflict strategy.

## v1.0.0 - Stable Release

Focus: production-ready baseline.

- [x] Stable config schema.
- [x] Migration support for config versions.
- [x] Complete command docs.
- [x] Better error messages.
- [x] Cross-platform test coverage.
- [x] Release workflow.
- [x] Package verification before publish.

## v1.1.0 - Persistent Sessions & Command Snippets

Focus: keep users inside Sshx between sessions and make repeatable remote commands easy to reuse.

- [x] Run SSH as a native full-screen session and return to connections when it exits.
- [x] Add versioned command snippet storage and automatic config migration.
- [x] Add snippet CRUD, tag filtering, and fuzzy search commands.
- [x] Add `:snippet <query>` to the TUI command palette.
- [x] Add an in-session snippet picker with `F2` and prefix alternatives.
- [x] Preview snippets before inserting or executing them.
- [x] Support `{{placeholder}}` values in snippets.
- [x] Include snippets in backup and restore workflows.

## Post-v1.0

Larger features should stay outside the v1 baseline until the core vault and SSH manager workflows are stable.

- SSH tunnel.
- Port forwarding.
- SFTP.
- Multiple sessions.
- Split terminal.
- Remote command execution.
- Docker integration.
- Kubernetes integration.
- Cloud sync.
- Encryption.
- Secret storage improvements.
- Plugin system.
