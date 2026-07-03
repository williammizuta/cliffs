# Changelog

## 0.1.0 - Unreleased

Initial release.

- Filesystem routing: the directory tree under `commandsDir` is the command tree.
- docopt-based command contract: each command exports `doc`, `run` and optional `requirements`.
- Prefix matching with ambiguity detection, alphabetical command listings, symlink support.
- Builtin `completion` command generating bash and zsh scripts that stay in sync with the command tree.
- Deterministic exit codes (`EXIT_CODES`); commands may set `process.exitCode` themselves.
- Public API: `run`, `completionScript`, `resolveCommand`, `listCommands`, `EXIT_CODES`, plus `Command` and `DocoptArgs` types.
