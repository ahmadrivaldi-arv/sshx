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

- Add import preview before saving.
- Add duplicate detection during add/import.
- Add skip, overwrite, or rename strategy for duplicates.
- Add bulk actions:
  - multi-select
  - delete multiple
  - favorite multiple
  - assign group
  - assign tags
- Add better recent connection metadata.

## v0.7.0 - Connection Health

Focus: help users know whether servers are reachable before connecting.

- Add SSH port health check.
- Add status indicators:
  - online
  - unreachable
  - timeout
  - auth required
- Add shortcut to check selected connection.
- Add bulk health check for visible connections.
- Store last checked timestamp.

## v0.8.0 - Command Palette

Focus: make Sshx faster for keyboard-heavy users.

- Add command palette with `:`.
- Support commands:
  - `:add`
  - `:edit`
  - `:delete`
  - `:import`
  - `:export`
  - `:logs`
  - `:theme`
- Add fuzzy command matching.
- Add command hints in footer.

## v0.9.0 - Backup & Restore

Focus: safer migration and recovery.

- Add `sshx backup`.
- Add `sshx restore`.
- Export full config without secrets.
- Validate backup before restore.
- Add restore conflict strategy.

## v1.0.0 - Stable Release

Focus: production-ready baseline.

- Stable config schema.
- Migration support for config versions.
- Complete command docs.
- Better error messages.
- Cross-platform test coverage.
- Release workflow.
- Package verification before publish.

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
