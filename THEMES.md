# Custom Themes

Sshx themes can be installed outside the application, shared as a single JSON
file, and selected without rebuilding Sshx.

## Light and Dark Terminals

The built-in `default`, `minimal`, and `mono` themes inherit the terminal's own
foreground and background colors. They adapt automatically when the terminal
switches between light and dark appearances:

```bash
sshx theme set default
```

The `dracula`, `nord`, `catppuccin`, and `tokyo-night` themes intentionally use
their named dark palettes. Custom themes also use explicit colors, so their
author should state whether they target a light or dark terminal.

## Install a Theme

Download a theme file and install it:

```bash
sshx theme install ~/Downloads/ocean.json
sshx theme set ocean --clear-accent
```

Use `--force` to replace an already installed theme:

```bash
sshx theme install ~/Downloads/ocean.json --force
```

Installed themes are stored in the user theme directory. Print and create that
directory with:

```bash
sshx theme path
```

On macOS and Linux the default is `~/.config/sshx/themes`. On Windows it is
`%LOCALAPPDATA%\sshx\themes`.

You can also copy a theme directly into that directory. When copied manually,
the filename must match the declared theme name:

```text
~/.config/sshx/themes/ocean.json
                         └── name must be "ocean"
```

Sshx discovers installed files automatically:

```bash
sshx theme list
sshx theme preview ocean
sshx theme set ocean
```

## Theme File Format

```json
{
  "name": "ocean",
  "label": "Ocean",
  "description": "A calm blue theme",
  "colors": {
    "accent": "#00aaff",
    "muted": "#557788",
    "border": "#224466",
    "text": "#e6f7ff",
    "favorite": "#ffee88",
    "warning": "#ffaa44",
    "danger": "#ff5566"
  },
  "decorated": true,
  "useConnectionColors": false
}
```

Rules:

- `name` uses lowercase letters, numbers, and hyphens, up to 64 characters.
- The filename must be `<name>.json` when copied directly.
- Built-in theme names are reserved.
- Every color uses six-digit `#RRGGBB` format.
- `decorated` controls borders and decorative branding and defaults to `true`.
- `useConnectionColors` allows per-connection colors and defaults to `false`.
- Theme files contain data only; Sshx never executes code from them.

The global `accentColor` preference overrides a theme's own accent. Use
`--clear-accent` when selecting a custom theme if you want its original accent:

```bash
sshx theme set ocean --clear-accent
```

Compact and ASCII preferences work with built-in and custom themes:

```bash
sshx theme set ocean --compact --ascii
```

## Share a Theme

Share the JSON file directly or publish it in a Git repository. Users can clone
or download it and run `sshx theme install <file>`.

Sshx installs local files deliberately; downloading remains under the user's
control and theme files remain easy to inspect before installation.
