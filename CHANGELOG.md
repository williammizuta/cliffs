# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/).

## 0.1.0 - 2026-07-10

### Added

- Filesystem routing: the directory tree under `commandsDir` is the command tree.
- docopt-based command contract: each command exports `doc`, `run` and optional `requirements`.
- Prefix matching with ambiguity detection, alphabetical command listings, symlink support.
- Builtin `completion` command generating bash and zsh scripts that stay in sync with the command tree.
- Deterministic exit codes (`EXIT_CODES`); commands may set `process.exitCode` themselves.
- Public API: `run`, `completionScript`, `resolveCommand`, `listCommands`, `EXIT_CODES`, plus `Command` and `DocoptArgs` types.
