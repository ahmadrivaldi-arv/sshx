# Changelog

All notable changes to Sshx are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.9.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/ahmadrivaldi-arv/sshx/compare/v0.3.0...v0.4.0
