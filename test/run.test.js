import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { run } from '../index.js';

const cli = fileURLToPath(new URL('./fixtures/app/cli.js', import.meta.url));

const runCli = function(args) {
  return execFileSync(process.execPath, [cli, ...args], {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
};

const runCliExpectingFailure = function(args, expectedStatus) {
  try {
    runCli(args);
  } catch (error) {
    assert.equal(error.status, expectedStatus);
    return error;
  }
  throw new Error(`Expected exit code ${expectedStatus}, but the command succeeded`);
};

test('prints the version on --version and -V', () => {
  assert.equal(runCli(['--version']), '1.2.3\n');
  assert.equal(runCli(['-V']), '1.2.3\n');
});

test('exits 2 on an ambiguous prefix and lists the candidates', () => {
  const error = runCliExpectingFailure(['b'], 2);
  assert.match(error.stderr, /Ambiguous command b/u);
  assert.match(error.stderr, / - boom/u);
  assert.match(error.stderr, / - broken/u);
});

test('exits 3 when a command is missing doc or run exports', () => {
  const error = runCliExpectingFailure(['broken'], 3);
  assert.match(error.stderr, /must export `doc` string and `run` function/u);
});

test('exits 4 with a clean message when a requirement fails', () => {
  const error = runCliExpectingFailure(['needy'], 4);
  assert.equal(error.stderr, 'THE_DEPENDENCY is not installed\n');
  assert.doesNotMatch(error.stdout, /should never run/u);
});

test('exits 5 when a command throws at runtime', () => {
  const error = runCliExpectingFailure(['boom'], 5);
  assert.match(error.stderr, /kaboom/u);
});

test('a commands/completion.js takes precedence over the builtin', () => {
  assert.equal(runCli(['completion']), 'custom completion command\n');
});

test('exits 3 when the commands directory does not exist', () => {
  const badCli = fileURLToPath(new URL('./fixtures/bad-dir-cli.js', import.meta.url));
  assert.throws(() => execFileSync(process.execPath, [badCli], { encoding: 'utf-8', stdio: 'pipe' }), (error) => {
    assert.equal(error.status, 3);
    assert.match(error.stderr, /Commands directory not found/u);
    return true;
  });
});

test('preserves an exit code set by the command itself', () => {
  runCliExpectingFailure(['exits'], 7);
});

test('prints a message when the commands directory is empty', async (context) => {
  const dir = mkdtempSync(join(tmpdir(), 'cliffs-'));
  const log = context.mock.method(console, 'log', () => null);
  const code = await run({ commandsDir: dir, name: 'emptycli' });
  assert.equal(code, 0);
  assert.equal(log.mock.calls[0].arguments[0], 'No commands found');
});

test('throws when name or commandsDir is missing', async () => {
  await assert.rejects(run({ name: 'mycli' }), TypeError);
  await assert.rejects(run({ commandsDir: '/tmp' }), TypeError);
});
