import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../example/cli.js', import.meta.url));

const runCli = function(args, options = {}) {
  return execFileSync(process.execPath, [cli, ...args], {
    encoding: 'utf-8',
    ...options,
  });
};

test('lists commands at the root in alphabetical order', () => {
  assert.equal(runCli([]), 'Available commands:\n - hello\n - math\n');
});

test('runs a top-level command with docopt args', () => {
  assert.equal(runCli(['hello', 'Ana']), 'Hello, Ana!\n');
  assert.equal(runCli(['hello', 'Ana', '--shout']), 'HELLO, ANA!\n');
});

test('runs a nested command resolved by prefix', () => {
  assert.equal(runCli(['m', 'a', '2', '3']), '5\n');
});

test('prints the doc on --help', () => {
  const output = runCli(['hello', '--help']);
  assert.match(output, /Usage:\n {2}hello \[<name>\] \[--shout\]/u);
});

test('help output matches the snapshot', (context) => {
  context.assert.snapshot(runCli(['hello', '--help']));
});

test('root listing matches the snapshot', (context) => {
  context.assert.snapshot(runCli([]));
});

test('fails with exit code 64 and prints the doc on invalid docopt input', () => {
  assert.throws(() => runCli(['math', 'add', '1'], { stdio: 'pipe' }), (error) => {
    assert.equal(error.status, 64);
    assert.match(error.stderr, /Usage:\n {2}add <a> <b>/u);
    return true;
  });
});

test('fails with exit code 1 on unknown command', () => {
  assert.throws(() => runCli(['nope'], { stdio: 'pipe' }), (error) => {
    assert.equal(error.status, 1);
    assert.match(error.stderr, /Command nope not found/u);
    return true;
  });
});

test('generates completion scripts via the builtin command', () => {
  const output = runCli(['completion', 'bash']);
  assert.match(output, /complete -F _mycli_completions mycli/u);
});

test('prints the builtin completion usage on --help', () => {
  assert.equal(runCli(['completion', '--help']), 'Usage: mycli completion (bash|zsh)\n');
});
