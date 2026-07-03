# Example CLI

A minimal cliffs app: one entry point ([`cli.js`](./cli.js)) and a [`commands/`](./commands) folder.

Run it from the repository root:

```bash
node example/cli.js                    # list the available commands
node example/cli.js hello Ana --shout  # run a command
node example/cli.js m a 2 3            # prefix matching: math add
node example/cli.js hello --help       # docopt help
node example/cli.js --version          # version from package.json
```
