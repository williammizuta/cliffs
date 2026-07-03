# cliffs

> Build CLIs from a folder of commands — the file system is the router.

**cliffs** (CLI + FS) builds command line tools from a folder of commands. The directory tree **is** the command tree: no registration, no routing tables, no framework boilerplate. Each command is a plain ES module with a [docopt](http://docopt.org/) string as its interface.

This strategy has been battle-tested powering dozens of commands in an internal company CLI before being extracted into this library.

## The idea

Most CLI frameworks make you describe your command tree twice: once in the filesystem and once in code (builders, decorators, registration calls). This library uses a single source of truth:

```
commands/
  hello.js          →  mycli hello
  math/
    add.js          →  mycli math add
    multiply.js     →  mycli math multiply
```

And each command file is self-describing — the docopt string is both the `--help` text and the argument parser:

```javascript
export const doc = `
Say hello
Usage:
  hello [<name>] [--shout]

Options:
  --shout  Print the greeting in uppercase
`;

export function run(args) {
  const greeting = `Hello, ${args['<name>'] || 'world'}!`;
  console.log(args['--shout'] ? greeting.toUpperCase() : greeting);
}
```

Because the CLI can always describe itself (listing subcommands, printing usage), you get for free:

- **Discoverability** — running `mycli` or `mycli math` lists what is available at that level.
- **Prefix matching** — `mycli m a 2 3` runs `math add` as long as the prefixes are unambiguous.
- **Ambiguity detection** — `mycli re` prints the candidates instead of guessing.
- **Shell completion** — the bash/zsh completion scripts just re-invoke the CLI and parse its output, so completions are always in sync with the command tree without generating anything.

## Quick start

```bash
npm install cliffs docopt
```

Create the entry point:

```javascript
#!/usr/bin/env node
import { run } from 'cliffs';

await run({
  name: 'mycli',
  commandsDir: new URL('./commands/', import.meta.url),
});
```

Add it as a binary in your `package.json`:

```json
{
  "type": "module",
  "bin": { "mycli": "./index.js" }
}
```

Create your first command in `commands/hello.js` (see above) and you are done:

```bash
$ mycli
Available commands:
 - hello

$ mycli hello Ana --shout
HELLO, ANA!
```

A runnable example lives in [`example/`](./example).

## Command contract

Every file in `commandsDir` must export:

| Export | Required | Description |
| --- | --- | --- |
| `doc` | yes | docopt string. Used for `--help`, argument parsing and usage errors. |
| `run(args)` | yes | Command logic. Receives the object parsed by docopt. May be async. |
| `requirements` | no | Array of async functions run before `run`. Throw an `Error` to abort with a clear message. |

Requirements example:

```javascript
export const requirements = [
  async function() {
    if (!process.env.MYCLI_HOME) {
      throw new Error('MYCLI_HOME environment variable is not set');
    }
  },
];
```

Commands do not need try/catch: errors are caught by the runner, reported, and mapped to an exit code. Invalid arguments print the `doc` to stderr and exit with code 64 instead of showing a stack trace.

## Routing rules

Given `mycli a b c`:

1. Walk `commandsDir` one arg at a time. A directory descends; a `.js` file is the command and the remaining args go to docopt.
2. Exact names win. Otherwise a unique prefix matches (`rep` → `repository`).
3. Zero matches → `Command x not found` (exit 1). Multiple matches → candidates are listed (exit 2).
4. Running out of args on a directory lists its subcommands (exit 0) — this is also what powers shell completion.

Only directories and `.js` files are considered: dotfiles, READMEs and other stray files never become commands.

## Shell completion

The CLI ships a builtin `completion` command (available unless you define your own `commands/completion.js`, which takes precedence):

```bash
# Bash
mycli completion bash > /usr/local/etc/bash_completion.d/mycli
# or: echo 'source <(mycli completion bash)' >> ~/.bashrc

# Zsh
echo 'source <(mycli completion zsh)' >> ~/.zshrc
```

The scripts are also available programmatically via `completionScript(name, 'bash' | 'zsh')`. Note that the builtin does not appear in command listings — only files in `commandsDir` do.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success (including help and listings) |
| 1 | Command not found |
| 2 | Ambiguous command prefix |
| 3 | Misconfigured CLI: missing commands directory, command module that fails to load or lacks `doc`/`run` exports, or an invalid docopt string |
| 4 | A requirement failed |
| 5 | The command threw at runtime |
| 64 | Usage error — the arguments did not match the command's `doc` ([EX_USAGE](https://man.freebsd.org/cgi/man.cgi?query=sysexits)) |

`run()` sets `process.exitCode` (it never calls `process.exit`, so streams flush and you can run it programmatically) and also returns the code.

## Recommended app structure

Commands should stay thin and share logic through components — plain modules the commands import. Use Node's [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) so commands don't need fragile relative paths:

```json
{
  "imports": {
    "#components/*": "./components/*"
  }
}
```

```javascript
import * as shell from '#components/shell.js';
```

Convention: commands can import components; components can import components; commands never import commands.

## API

```javascript
import { run, completionScript, resolveCommand, listCommands, EXIT_CODES } from 'cliffs';
```

- `run({ name, commandsDir, argv?, version? })` — resolve and execute a command. `name` is the binary name (used in completion and messages), `commandsDir` is a path or `file://` URL, `argv` defaults to `process.argv.slice(2)`. When `version` is provided, `mycli --version` (or `-V`) prints it. Returns the exit code.
- `completionScript(name, shell)` — returns the bash or zsh completion script for a CLI named `name`.
- `resolveCommand(commandsDir, argv)` — the pure routing step, useful for testing. Returns `{ type: 'command' | 'list' | 'not-found' | 'ambiguous', ... }`.
- `listCommands(dir)` — the command names available in a directory.
- `EXIT_CODES` — the table above, by name.

## Design notes

- **Zero config, one dependency.** The only runtime dependency is `docopt`. Everything else is `node:` builtins.
- **docopt is pinned at 0.6.2** — the package is old but stable and tiny; the docopt language itself is a frozen spec. Vendoring it is an option if the dependency ever becomes a concern.
- **No build step.** Plain ESM JavaScript with hand-written TypeScript definitions, Node >= 20.11.
- **Commands run from the user's cwd.** The library never calls `process.chdir`, so `resolve('./file.csv')` inside a command behaves as the user expects.
- **Windows:** routing and execution work everywhere Node runs, but the generated completion scripts are bash/zsh only.

## Roadmap

- `npm create` scaffolder (entry point + example command + imports alias)
- Optional builtin `help` command
- Fish completion

## License

MIT
