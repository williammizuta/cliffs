# Agent notes

cliffs is a zero-config CLI framework: the filesystem is the command router. Plain ESM JavaScript, no build step, Node >= 22. User-facing documentation lives in README.md — do not duplicate it here.

## Commands

- `npm test` — full test suite (node:test, no framework)
- `npm run lint` — ESLint with the strict `all` preset plus `eslint-plugin-n`; must pass before committing. Do not add rule exceptions without strong justification.
- `npm run test:coverage` — suite with a coverage report
- `npm run test:update-snapshots` — regenerate snapshot files

## Snapshot tests

Completion scripts, help output and listings are snapshot-tested. When intentionally changing user-facing output, run `npm run test:update-snapshots` and commit the updated `test/*.snapshot` files. Never weaken or delete a snapshot assertion to make a failing test pass.

## Design constraints

- Zero runtime dependencies except `docopt`, pinned at 0.6.2 on purpose. Do not add dependencies.
- No build step: plain ESM with hand-written type definitions. When changing exports in `index.js`, update `index.d.ts` to match; API documentation lives as JSDoc in the `.d.ts`, not in the `.js` sources.
- `run()` never calls `process.exit`; exit codes flow through `EXIT_CODES` and `process.exitCode`, and commands may set their own.
- Tests are mostly subprocess-based (`execFileSync` against fixtures in `test/fixtures/`); prefer that style for behavior tests.
- Windows is supported for routing and execution (CI runs it); completion scripts are bash/zsh only. Guard symlink-dependent tests with a win32 skip.

## Conventions

- Commit messages: English, imperative mood, one short line (e.g. "Add…", "Fix…").
- Update CHANGELOG.md when changing user-facing behavior.
