# Command Reference

This is the complete command-line reference for Sshx v1.2.0. Run
`sshx <command> --help` for the same options in the terminal.

## Global

```text
sshx                 Open the interactive TUI
sshx --help          Show command help
sshx --version       Show the installed version
```

## Connections

### `sshx add <name>`

Add a connection. `--host` and `--username` are required.

```text
--host <host>
-u, --username <username>
-p, --port <port>                 Default: 22
-i, --identity-file <file>
-g, --group <group>
-t, --tags <comma-separated>
-c, --color <color>
--favorite
--password-env <variable>
-o, --ssh-option <key=value>      Repeatable
--suppress-weak-crypto-warning
```

Passwords are read from the named environment variable and saved through the
operating-system credential store.

### `sshx edit <id>`

Edit a connection by id.

```text
--name <name>
--host <host>
-u, --username <username>
-p, --port <port>
-i, --identity-file <file>
--clear-identity-file
-g, --group <group>
--clear-group
-t, --tags <comma-separated>
-c, --color <color>
--password-env <variable>
--clear-password
-o, --ssh-option <key=value>      Repeatable; replaces current options
--clear-ssh-options
--suppress-weak-crypto-warning
--show-weak-crypto-warning
```

### `sshx list`

List connections.

```text
-s, --search <query>
-g, --group <group>
-t, --tags <comma-separated>
```

### Other connection mutations

```text
sshx delete <id>
sshx duplicate <id>
sshx rename <id> <name>
sshx favorite <id>
```

## Connect and health

```text
sshx connect <id-or-exact-name>
sshx ssh <id-or-exact-name>       Alias for connect
sshx check <id-or-exact-name>
sshx check --all
```

Health options:

```text
-a, --all                         Check every connection
--timeout <seconds>               Default: 5
```

Health results are `online`, `unreachable`, `timeout`, or `auth-required`.

Sessions launched from the TUI temporarily take over the native terminal like
Nano or Vim while the Sshx browser remains alive in the background. Press `F2`
to open the local snippet picker. `Ctrl+B`, then `S` is enabled by default;
`Ctrl+G`, then `S` and `Ctrl+]`, then `S` can be configured. Exiting the remote
shell returns to the connection list.

## Import and export

### `sshx import`

Import OpenSSH config or an Sshx JSON/YAML export.

```text
-f, --file <file>                 Default: ~/.ssh/config
--format <ssh-config|json|yaml>
--strategy <skip|overwrite|rename>
--apply
```

Import is preview-only by default. Add `--apply` after reviewing the plan.

### `sshx export <file>`

Export connections. This is a connection-only interchange format; use
`sshx backup` for the full configuration.

```text
-f, --format <json|yaml>          Default: json
```

## Backup and restore

```text
sshx backup <file> [--format <json|yaml>]
sshx restore <file> [options]
```

Restore options:

```text
--format <json|yaml>
--strategy <skip|overwrite|rename|replace>
--validate-only
```

`replace` replaces the complete current vault. Backups include configuration,
connection metadata, recents, snippets, and theme preferences, but exclude
passwords and password secret references. On the same machine, restore preserves
the existing secure-vault reference when a connection ID or full SSH endpoint
matches. Restoring on another machine still requires entering passwords again.
If an earlier replace restore removed a local reference, running the restore
again can reconnect an existing credential that is still present in the secure
vault under the same connection ID.

## Command snippets

```text
sshx snippet
sshx snippet list [--search <query>] [--tags <comma-separated>]
sshx snippet show <name-or-id>
sshx snippet add <name> --command <command> [options]
sshx snippet edit <name-or-id> [options]
sshx snippet delete <name-or-id>
```

Add options:

```text
-c, --command <command>          Required single-line command
-d, --description <text>
-t, --tags <comma-separated>
```

Edit options:

```text
--name <name>
-c, --command <command>
-d, --description <text>
--clear-description
-t, --tags <comma-separated>
```

Use placeholders such as `{{container}}` in a command. The in-session picker
prompts for each value, previews the rendered command, and lets you insert with
`I` or insert and execute with `X`/`Enter`.

The same CRUD workflow is available in the TUI. Press the configured snippet
manager key (`s` by default) from the connection browser, or use `:snippet
<query>` from the command palette.

## Keymaps

```text
sshx keymap
sshx keymap set snippet-picker <binding[,binding...]>
sshx keymap set snippet-manager <key>
sshx keymap reset
```

Supported picker bindings:

```text
f2
ctrl-b-s
ctrl-g-s
ctrl-]-s
```

The snippet-manager shortcut must be one lowercase letter that does not
conflict with an existing connection-browser action.

## Themes

```text
sshx theme                         Preview the active theme
sshx theme list                    List built-in and installed themes
sshx theme preview <name>
sshx theme install <file> [--force]
sshx theme path
sshx theme set <name> [options]
```

Theme set options:

```text
--accent <#RRGGBB>
--clear-accent
--compact | --expanded
--ascii | --unicode
```

See [THEMES.md](THEMES.md) for the external theme file format.

## Logs

```text
sshx logs
sshx logs -n <count>               Default: 80
sshx logs --path
```

## TUI command palette

Press `:` and fuzzy-search grouped commands. Recent commands appear first when
the query is empty, and available direct shortcuts are shown on the right.

```text
:add
:edit
:delete
:import [file] [--apply] [--strategy=skip|overwrite|rename]
:export <file>
:logs
:theme [name]
:snippet <query>
:help
:about
```

Without a file, `:import` previews `~/.ssh/config`. Without a name, `:theme`
opens the native theme picker. Press `T` to open that picker directly, `?` for
contextual help, and `Tab` to switch list/detail panels on narrow terminals.
