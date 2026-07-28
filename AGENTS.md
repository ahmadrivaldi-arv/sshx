# Repository Instructions

These instructions apply to the entire Sshx repository.

## Sources of Truth

- Use `ROADMAP.md` for planned product work and future ideas.
- Use `CHANGELOG.md` for completed user-facing changes grouped by release.
- Use `COMMANDS.md` for CLI and TUI command behavior.
- Use `THEMES.md` for the external theme format and theme distribution workflow.
- Use `README.md` for the concise public product overview and installation path.
- Keep these documents consistent with the implementation. Do not document features that do not exist.

## Roadmap Discipline

- Record every new product, UX, integration, or ecosystem idea from user discussion in `ROADMAP.md` during the same task.
- Place an idea under the nearest appropriate planned version. Use `Long-term Ideas` when the scope or release is not yet clear.
- Consolidate overlapping ideas instead of adding duplicate checklist items.
- Keep unimplemented work unchecked.
- Mark a roadmap item complete only after its implementation, relevant tests, and documentation are complete.
- When implementation changes the intended scope, update the roadmap wording to describe the shipped behavior.
- Ordinary bug-fix details do not need separate roadmap entries unless they introduce meaningful future product work.

## Durable Product Decisions

- Preserve native SSH terminal behavior. Nano, Vim, terminal cursor placement, input, signals, and full-screen remote applications must behave like a normal SSH session.
- Do not reintroduce an embedded terminal emulator into the Ink component tree. Local overlays may use the alternate screen but must restore the remote session and cursor cleanly.
- Keep users inside Sshx between connections: leaving an SSH session should return to the connection browser.
- Snippets must remain manageable from both the CLI and TUI.
- In-session snippets must be previewed before use and default to insertion without execution.
- Escape terminal control characters and keep snippet commands restricted to safe single-line input.
- Keyboard shortcuts must be configurable, documented, and checked for conflicts with common terminal and application shortcuts.
- Neutral themes and core UI text must inherit terminal foreground/background colors so light and dark terminal appearances remain readable.
- Named palette themes may intentionally target light or dark terminals, but their intended appearance must be documented.
- External themes should remain installable and shareable without rebuilding Sshx, following the shell-theme ecosystem direction documented in the roadmap.
- Installed themes must be selectable from the TUI as well as the CLI. The TUI picker must support `Up`/`Down` preview navigation and must not persist a preview until the user confirms it.
- Confirmed TUI theme changes must offer `Apply & restart`, `Apply next launch`, and `Cancel`; canceling or pressing `Esc` must restore the original theme without disrupting the current session.
- Reserve the large Sshx wordmark for onboarding and About screens. Use a compact mark in the main UI and avoid placing decorative branding in contextual help or narrow layouts.
- Prefer restrained semantic color, clear hierarchy, responsive layouts, consistent key hints, and accessible states over decorative contrast or excessive animation.
- Never write password values or secret-store references into backups. Same-machine restore should preserve an existing local vault reference only when the connection ID or full SSH endpoint matches.

## Website Architecture

- Keep the marketing and documentation website isolated in `website/`; do not mix website runtime code into the CLI `src/` tree.
- Use Astro with TypeScript as a static-first framework.
- Use Starlight for the documentation section.
- Use React islands only where client-side interaction is necessary, such as the terminal demo, copy buttons, theme previews, and appearance controls.
- Use Tailwind CSS for layout utilities and CSS custom properties for semantic design tokens.
- Keep the root repository documents as the source of truth. Ingest or synchronize `README.md`, `COMMANDS.md`, `THEMES.md`, `ROADMAP.md`, and `CHANGELOG.md` during the website build instead of maintaining conflicting copies.
- Reuse and optimize real assets from `screenshots/`; do not fabricate product screenshots or terminal behavior.
- Keep the initial website fully static. Do not add server rendering, authentication, a database, or API routes without a documented product requirement.
- Use this baseline structure:

```text
website/
├── public/
│   ├── screenshots/
│   ├── videos/
│   └── favicon.svg
├── src/
│   ├── components/
│   ├── content/docs/
│   ├── data/
│   ├── layouts/
│   ├── pages/
│   └── styles/
├── astro.config.ts
├── package.json
└── tsconfig.json
```

- Add responsive, light/dark, keyboard-navigation, accessibility, and production-build validation for website changes.
- Prefer Git-integrated preview deployments. Keep the output portable between Vercel, Cloudflare Pages, and GitHub Pages unless hosting-specific functionality is explicitly required.

## Documentation Updates

- When a command or shortcut changes, update `COMMANDS.md` and the relevant README section.
- When theme behavior or schema changes, update `THEMES.md`.
- When a user-facing feature ships, update `CHANGELOG.md`.
- When a new idea is accepted or discussed as future work, update `ROADMAP.md`.
- Update this `AGENTS.md` only for durable repository rules, architectural constraints, or recurring workflow decisions. Do not use it as a transcript or release log.

## Development and Validation

- Use TypeScript and preserve strict type checking.
- Prefer small reusable components and services over adding more state to large screens.
- Keep layouts usable at narrow, medium, and wide terminal sizes.
- Cover behavior changes with focused tests, including terminal input and rendering edge cases where applicable.
- Run `bun run check` before considering implementation complete.
- Run `bun run verify:package` for package or release changes.
- Preserve unrelated worktree changes and stage only files that belong to the current task.

## Git and Release Workflow

- Do not implement changes directly on `main`; create or switch to a scoped branch first.
- Use focused commits that describe the completed change.
- Before deleting a branch, verify with Git ancestry that it is merged into `main`.
- Preserve `development` as a long-lived branch unless the user explicitly changes the branching strategy.
- Delete merged short-lived `feature/*`, `fix/*`, or `agent/*` branches locally and remotely when cleanup is requested.
- Release changes through a pull request and passing multi-platform CI.
- Merge to `main` before creating the version tag.
- Ensure the tag version matches `package.json`.
- Let the tag-triggered release workflow publish npm and create the GitHub Release, then verify both externally.
