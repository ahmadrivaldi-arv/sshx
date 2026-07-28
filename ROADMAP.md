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
- [x] Add snippet search and CRUD directly inside the TUI.
- [x] Add persistent configurable keymaps for snippet workflows.
- [x] Add `:snippet <query>` to the TUI command palette.
- [x] Add an in-session snippet picker with `F2` and prefix alternatives.
- [x] Preview snippets before inserting or executing them.
- [x] Support `{{placeholder}}` values in snippets.
- [x] Include snippets in backup and restore workflows.

## v1.2.0 - Modern TUI

Focus: establish a consistent, responsive visual system that feels modern without sacrificing native terminal behavior or accessibility.

- [x] Add semantic design tokens for accent, text, muted, border, success, warning, danger, and selected states.
- [x] Add `NO_COLOR` support and preserve adaptive light/dark terminal colors.
- [x] Redesign the main screen as a responsive connection-list and detail split view.
- [x] Redesign the snippet manager as a list and command-preview split view.
- [x] Modernize the command palette with grouped actions, recent commands, descriptions, and right-aligned shortcuts.
- [x] Add a native TUI theme picker so installed themes can be browsed without running a CLI command.
- [x] Support `Up`/`Down` theme navigation with a temporary live preview that does not immediately persist the selection.
- [x] Confirm theme selection with `Apply & restart`, `Apply next launch`, and `Cancel` actions; canceling must restore the original theme.
- [x] Add a reusable key-hint component with consistent styling across screens.
- [x] Add contextual help with `?` based on the active screen and interaction mode.
- [x] Add first-run onboarding with SSH config import, manual connection, and documentation actions.
- [x] Add an About screen with the Sshx wordmark, version, active theme, documentation, repository, npm, license, and update information.
- [x] Use a large responsive Sshx wordmark only in onboarding and About, with a compact brand mark in space-constrained screens.
- [x] Add wide, medium, and narrow terminal layouts with graceful single-panel fallback.
- [x] Add clear, restrained progress indicators and transient status messages for long-running actions.
- [x] Highlight snippet placeholders and clearly distinguish insert-only from insert-and-execute actions.
- [x] Add visual regression coverage for common terminal sizes, light/dark appearances, ASCII mode, and `NO_COLOR`.

## v1.3.0 - Theme Ecosystem

Focus: make external themes easy to discover, share, install, and maintain like shell theme ecosystems.

- [ ] Extend theme metadata with author, homepage, appearance, preview, and minimum Sshx version.
- [ ] Add remote theme installation from a repository or package reference.
- [ ] Add theme search, update, and update-all commands.
- [ ] Add explicit light, dark, and adaptive compatibility metadata.
- [ ] Add optional theme glyph sets with Unicode and ASCII fallbacks.
- [ ] Define a community theme repository format and publishing guide.
- [ ] Add safe preview and validation before installing or updating a remote theme.

## v1.4.0 - Website & Documentation Hub

Focus: introduce Sshx with an accurate, accessible website generated from repository documentation and real product assets.

- [ ] Use a static-first Astro and TypeScript architecture with Starlight for documentation.
- [ ] Use isolated React islands only for interactions such as the terminal demo, copy buttons, and appearance controls.
- [ ] Build a responsive product website with automatic light and dark appearance support.
- [ ] Add clear installation, feature, native SSH, snippet workflow, theme, security, and open-source sections.
- [ ] Reuse optimized screenshots, GIFs, and videos from the repository instead of fabricated product UI.
- [ ] Add copyable install commands and direct links to GitHub, npm, releases, issues, and documentation.
- [ ] Add a safe interactive terminal demonstration that never pretends to establish a real SSH connection.
- [ ] Add a custom theme gallery with compatibility metadata and install examples such as Monokai.
- [ ] Add SEO, Open Graph, structured application metadata, sitemap, robots, and a useful not-found page.
- [ ] Keep website claims and version information synchronized with repository documentation and published releases.
- [ ] Add GitHub-integrated preview and production deployments with custom-domain support.
- [ ] Validate responsive layouts, keyboard navigation, reduced motion, accessibility, and production builds.

## v2.0.0 - TUI Runtime Modernization

Focus: adopt the next major Ink runtime only when the supported Node.js baseline can move forward safely.

- [ ] Evaluate migration to Node.js 22, React 19, and Ink 7.
- [ ] Use native window-size and box-metrics APIs for more reliable responsive layouts.
- [ ] Use improved focus management for forms, overlays, and keyboard navigation.
- [ ] Evaluate synchronized rendering and limited animation APIs without introducing flicker.
- [ ] Preserve native SSH, Nano, Vim, and other full-screen terminal application behavior.
- [ ] Add compatibility and performance testing before dropping Node.js 20 support.

## Long-term Ideas

Larger features should remain exploratory until the core vault, SSH manager, and modern TUI workflows are stable.

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
