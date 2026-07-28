# Changelog

All notable changes to Sshx are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-28

### Added

- Semantic theme tokens for accent, text, muted, border, success, warning,
  danger, and selected states.
- `NO_COLOR` support with terminal-adaptive foregrounds and no hardcoded
  background colors.
- Responsive wide, medium, and narrow connection layouts with single-panel
  list/detail navigation on small terminals.
- A list/preview snippet manager with highlighted placeholders and clear
  insert-only behavior guidance.
- A grouped command palette with recent actions, descriptions, and shortcut
  hints.
- A native TUI theme picker with temporary live preview and explicit
  apply-and-restart, apply-next-launch, and cancel choices.
- Reusable key hints, transient status feedback, contextual `?` help,
  first-run actions, and a responsive About screen and Sshx wordmark.
- TUI snapshot coverage for common terminal sizes, adaptive/dark appearances,
  ASCII mode, and `NO_COLOR`.

### Changed

- Custom themes may define optional `success` and `selected` colors while
  remaining backward compatible with existing theme files.
- `:import` without a file now previews the default `~/.ssh/config`.
- `:theme` without a name opens the native theme picker.

## [1.1.0] - 2026-07-27

### Added

- Native full-screen SSH sessions that preserve normal terminal cursor, input, and application behavior.
- Persistent TUI navigation that returns to the connection list when SSH exits.
- Versioned command snippets with CLI CRUD, tag filters, and fuzzy search.
- A TUI snippet manager with search, add, edit, and delete workflows.
- Persistent configurable keymaps for the TUI manager and in-session picker.
- `:snippet <query>` in the TUI command palette.
- A local in-session picker with configurable `F2`, `Ctrl+B`, `Ctrl+G`, or `Ctrl+]` bindings.
- Placeholder prompts for values such as `{{container}}`.
- Preview-first insertion with separate insert and insert-and-execute actions.
- Snippet support in full backup and restore conflict strategies.

### Changed

- Configuration schema v2 adds snippet storage and automatically migrates v1 config.
- The in-session snippet picker now uses a clearer full-screen layout with scrolling,
  selected-snippet details, responsive narrow-terminal rendering, and adaptive ANSI colors.
- The default, minimal, and mono themes now inherit terminal foreground and background colors
  for automatic light and dark appearance compatibility.

### Security

- Snippet previews escape terminal control characters and commands are restricted to one line.
- In-session snippets are inserted without execution by default.

## [1.0.0] - 2026-07-26

### Added

- Stable `configVersion: 1` schema and automatic migration for pre-v1 configuration.
- Clear rejection of configuration created by unsupported future versions.
- Complete command reference in `COMMANDS.md`.
- Actionable CLI error hints and field-specific configuration validation messages.
- Deterministic Linux, macOS, and Windows path handling with cross-platform tests.
- Multi-platform CI and tag-driven npm release workflows.
- Package verification that checks version, executable, documentation, and test-file exclusion.

### Changed

- Legacy config migration is persisted on first v1 load.
- Pre-v1 backup files remain restorable through the config migration layer.

## [0.9.0] - 2026-07-26

### Added

- `sshx backup` for versioned JSON or YAML backups of the full configuration.
- `sshx restore` with validation-only mode.
- Skip, overwrite, rename, and full replace restore strategies.
- Restore preservation of recent connections, themes, and connection metadata.

### Security

- Backups always omit password secret references, including when restoring externally created files.

## [0.8.0] - 2026-07-26

### Added

- A `:` command palette with fuzzy matching and keyboard navigation.
- Native palette actions for add, edit, and delete.
- Operational `:import`, `:export`, `:logs`, and `:theme` commands with arguments.
- Palette usage and command hints in the TUI.

## [0.7.0] - 2026-07-26

### Added

- SSH health probes with online, unreachable, timeout, and authentication-required outcomes.
- `sshx check <target>` and `sshx check --all` commands with configurable timeouts.
- TUI health indicators and last-checked timestamps.
- `h` checks the selected or multi-selected connections; `H` checks all visible connections.

## [0.6.0] - 2026-07-26

### Added

- Read-only import previews with explicit `--apply`.
- Skip, overwrite, and rename strategies for duplicate imports.
- Duplicate detection by case-insensitive name or SSH endpoint.
- TUI multi-select with bulk delete, favorite, group, and tag actions.
- Connection counts, last outcomes, durations, and activity timestamps.

### Changed

- Connection activity is recorded after SSH exits so failed sessions are represented accurately.
- Import output now shows every planned action before configuration is changed.

## [0.5.0] - 2026-07-26

### Added

- Seven built-in themes: default, minimal, mono, dracula, nord, catppuccin, and tokyo-night.
- Persistent theme configuration with custom `#RRGGBB` accent colors.
- Persistent compact layout and ASCII compatibility preferences.
- `sshx theme list`, `sshx theme set <name>`, and `sshx theme preview <name>` commands.
- Oh My Zsh-style external JSON themes with automatic user-directory discovery.
- `sshx theme install <file>` and `sshx theme path` commands for custom themes.
- ASCII-safe symbols and borders for terminals with limited Unicode support.

### Changed

- Centralized TUI colors, borders, symbols, warnings, and connection highlighting in the active theme.
- Made compact mode configurable while retaining automatic small-terminal behavior.
- Added theme defaults when loading pre-v0.5 configuration files.

## [0.4.0] - 2026-07-25

### Added

- Responsive compact TUI layout with automatic small-terminal detection and a manual `c` toggle.
- Per-connection OpenSSH options in the TUI, CLI, configuration, imports, and exports.
- `--suppress-weak-crypto-warning` support, which passes `WarnWeakCrypto=no` to OpenSSH.
- CLI options for clearing stored passwords, identity files, groups, and OpenSSH options.
- Backward-compatible defaults for connections created before v0.4.0.

### Changed

- Improved add and edit navigation, validation, field clearing, and saving feedback.
- Improved delete confirmation, loading, empty, search, and error states.
- Limited connection rendering to the visible terminal viewport.
- Made duplicate connection names unique and copied password credentials independently.

### Fixed

- Prevented redraw artifacts by using a managed alternate terminal screen.
- Placed OpenSSH options before the destination so they are parsed consistently across platforms.
- Preserved additional per-host OpenSSH directives when importing SSH config files.

[1.2.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.3.0...v0.4.0
